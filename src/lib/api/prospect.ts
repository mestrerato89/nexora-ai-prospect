import { supabase } from "@/integrations/supabase/client";

export interface ProspectResult {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  category: string;
  hours?: string;
  open: boolean;
  score: number;
  confidence: "high" | "medium" | "low";
}

export interface ProspectSearchParams {
  niche: string;
  location: string;
  maxResults?: number;
  minRating?: number;
  platform?: "google_maps" | "instagram" | "facebook";
}

const LOCAL_SCRAPER_URL = "http://localhost:3099";

const LOCATION_STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "na", "no", "bairro", "cidade", "estado", "brasil",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLocationTerms(location: string): string[] {
  const normalized = normalizeText(location);
  if (!normalized) return [];

  const segments = normalized
    .split(/[,-/]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const words = normalized
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !LOCATION_STOPWORDS.has(w));

  return Array.from(new Set([...segments, ...words]));
}

function getLocationMatchScore(address: string, location: string): number {
  const normalizedAddress = normalizeText(address || "");
  if (!normalizedAddress) return 0;

  const terms = buildLocationTerms(location);
  if (terms.length === 0) return 1;

  return terms.reduce((score, term) => (normalizedAddress.includes(term) ? score + 1 : score), 0);
}

function prioritizeByLocation(results: ProspectResult[], location: string): ProspectResult[] {
  if (!results.length) return results;

  const ranked = results
    .map((result) => ({ result, locationScore: getLocationMatchScore(result.address || "", location) }))
    .sort((a, b) => {
      if (b.locationScore !== a.locationScore) return b.locationScore - a.locationScore;
      return (b.result.score || 0) - (a.result.score || 0);
    });

  const strictMatches = ranked.filter((r) => r.locationScore > 0);
  const minStrict = Math.max(3, Math.ceil(ranked.length * 0.4));

  const selected = strictMatches.length >= minStrict ? strictMatches : ranked;
  return selected.map((r) => r.result);
}

async function isScraperOnline(): Promise<boolean> {
  try {
    const resp = await fetch(`${LOCAL_SCRAPER_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    return resp.ok;
  } catch {
    return false;
  }
}

async function searchLocal(params: ProspectSearchParams): Promise<{ businesses: ProspectResult[]; searchId?: string }> {
  // Inicia busca
  const resp = await fetch(`${LOCAL_SCRAPER_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await resp.json();

  // Se veio do cache, retorna direto
  if (data.fromCache && data.businesses) {
    return { businesses: data.businesses.map(mapLocalResult) };
  }

  // Senão, faz polling do status
  return { businesses: [], searchId: data.searchId };
}

export async function pollSearchStatus(
  niche: string,
  location: string,
  onProgress: (results: ProspectResult[], status: string) => void
): Promise<ProspectResult[]> {
  const maxAttempts = 120; // 2 minutos max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const resp = await fetch(
        `${LOCAL_SCRAPER_URL}/api/search/status?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`
      );
      const data = await resp.json();

      if (data.results?.length > 0) {
        onProgress(data.results.map(mapLocalResult), data.status || "Buscando...");
      }

      if (data.status === "done") {
        return (data.results || []).map(mapLocalResult);
      }

      if (data.status === "error") {
        throw new Error(data.error || "Erro no scraper");
      }
    } catch (e) {
      if (i > 10) throw e; // allow initial failures
    }
  }

  throw new Error("Timeout: busca demorou demais");
}

function mapLocalResult(r: any, i: number): ProspectResult {
  return {
    id: r.id || `local-${Date.now()}-${i}`,
    name: r.name || "",
    address: r.address || "",
    phone: r.phone || "",
    website: r.website || "",
    rating: r.rating || 0,
    reviews: r.reviews || 0,
    category: r.category || "",
    hours: r.hours || "",
    open: r.open ?? r.is_open ?? true,
    score: r.score || 0,
    confidence: r.confidence || (r.phone || r.website ? "high" : "medium"),
  };
}

async function searchCloud(params: ProspectSearchParams): Promise<{ businesses: ProspectResult[]; source: SearchSource }> {
  const { data, error } = await supabase.functions.invoke("prospect-search", {
    body: params,
  });

  if (error) {
    const httpError = error as any;
    const context = httpError?.context as Response | undefined;

    if (context) {
      let backendMessage = "";
      try {
        const payload = await context.clone().json();
        backendMessage = payload?.error || "";
      } catch {
        // ignore parse errors
      }

      if (context.status === 429) {
        throw new Error(
          backendMessage ||
          "Busca temporariamente limitada. Aguarde cerca de 1 minuto e tente novamente."
        );
      }

      if (context.status === 402) {
        throw new Error(backendMessage || "Créditos insuficientes ou API Key inválida.");
      }

      if (backendMessage) {
        throw new Error(backendMessage);
      }
    }

    throw new Error(httpError?.message || "Erro na conexão com API Cloud");
  }

  if (data?.error) throw new Error(data.error);

  // Mapping cloud sources to frontend sources
  let source: SearchSource = "ai";
  if (data?.source === "google_places") source = "google";
  if (data?.source === "google_search") source = "google";

  return {
    businesses: data?.businesses || [],
    source
  };
}

export type SearchSource = "scraper" | "ai" | "google" | "instagram" | "facebook";

export async function searchProspects(
  params: ProspectSearchParams,
  onProgress?: (results: ProspectResult[], status: string) => void
): Promise<{ results: ProspectResult[]; source: SearchSource }> {
  let cloudError: string | null = null;

  // --- TIERED SEARCH STRATEGY ---
  onProgress?.([], "Iniciando busca inteligente...");

  // First Tier: If platform is Instagram or Facebook, we skip local scraper
  // as the local scraper is built specifically for Google Maps.
  if (params.platform === "instagram" || params.platform === "facebook") {
    onProgress?.([], `Conectando com inteligência avançada para ${params.platform}...`);
    try {
      const cloudResponse = await searchCloud(params);
      if (cloudResponse.businesses.length > 0) {
        return {
          // Skip prioritizeByLocation for social media, AI already does it
          results: cloudResponse.businesses,
          source: params.platform
        };
      }
    } catch (err: any) {
      cloudError = err.message || `Erro na busca via ${params.platform}`;
      console.warn(`[Prospect] API error for ${params.platform}:`, cloudError);
    }
  } else {
    // Original local scraper logic for Google Maps
    const scraperOnline = await isScraperOnline();
    if (scraperOnline) {
      onProgress?.([], "Buscador local detectado! Consultando sem custos...");
      try {
        const { businesses, searchId } = await searchLocal(params);
        if (businesses.length > 0) {
          return { results: prioritizeByLocation(businesses, params.location), source: "scraper" };
        }

        const results = await pollSearchStatus(params.niche, params.location, (partial, status) => {
          onProgress?.(prioritizeByLocation(partial, params.location), status);
        });

        if (results.length > 0) {
          return { results: prioritizeByLocation(results, params.location), source: "scraper" };
        }
      } catch (localErr) {
        console.warn("[Prospect] Local scraper attempt failed, falling back to Cloud:", localErr);
      }
    }

    // 2. SECOND TIER: Google Cloud API (Paid / High Quality)
    // If local is offline or failed, use the official API (which uses the $200 free credit).
    onProgress?.([], "Buscador local offline. Conectando ao Google Cloud...");
    try {
      const cloudResponse = await searchCloud(params);
      if (cloudResponse.businesses.length > 0) {
        return {
          results: prioritizeByLocation(cloudResponse.businesses, params.location),
          source: cloudResponse.source
        };
      }
    } catch (err: any) {
      cloudError = err.message || "Erro na conexão Cloud";
      console.warn("[Prospect] Cloud API error:", cloudError);
    }
  }

  // 3. THIRD TIER: Gemini Fallback (AI-powered search)
  // This is already integrated within the searchCloud function on the backend as a fallback.
  // We explain the final status to the user if everything fails.

  if (cloudError) {
    if (cloudError.includes("API Key") || cloudError.includes("variable") || cloudError.includes("prospect-search")) {
      throw new Error("Erro de Configuração:\nSua chave Google Maps API não foi configurada no Supabase ou o limite de busca foi excedido.");
    }
    throw new Error(`Erro na busca: ${cloudError}`);
  }

  throw new Error("Nenhum resultado encontrado:\nO buscador local está offline e o Google Cloud não retornou dados para este nicho/localização.");
}
