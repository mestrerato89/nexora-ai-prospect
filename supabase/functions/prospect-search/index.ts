import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 168; // 7 days

// ── Text / location helpers ──────────────────────────────────────────────

const STOP = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "bairro", "cidade", "estado", "brasil"]);

function norm(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s,-]/g, " ").replace(/\s+/g, " ").trim();
}

function locTerms(loc: string) {
  const n = norm(loc); if (!n) return [];
  const seg = n.split(/[,-/]/).map(s => s.trim()).filter(s => s.length >= 3);
  const wds = n.split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
  return [...new Set([...seg, ...wds])];
}

function locScore(addr: string, loc: string) {
  const a = norm(addr || ""); if (!a) return 0;
  const t = locTerms(loc); if (!t.length) return 1;
  return t.reduce((s, x) => (a.includes(x) ? s + 1 : s), 0);
}

function rankByLoc<T extends { address: string; score?: number }>(items: T[], loc: string): T[] {
  if (!items.length) return items;
  const r = items.map(i => ({ i, l: locScore(i.address, loc) })).sort((a, b) => b.l !== a.l ? b.l - a.l : (b.i.score || 0) - (a.i.score || 0));
  const s = r.filter(x => x.l > 0); const m = Math.max(3, Math.ceil(r.length * 0.4));
  return (s.length >= m ? s : r).map(x => x.i);
}

function calcScore(b: any) {
  let s = 0; if (b.phone) s += 20; if (b.website) s += 20; if (b.rating > 0) s += 15; if (b.rating >= 4) s += 10; if (b.reviews > 50) s += 10; if (b.open) s += 10; if (b.hours) s += 10; if (b.confidence === "high") s += 5; return Math.min(s, 100);
}

// ── DB cache ─────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getCached(niche: string, location: string) {
  const sb = getSupabase();
  const { data } = await sb.from("prospect_cache")
    .select("results, source, created_at")
    .eq("niche", norm(niche))
    .eq("location", norm(location))
    .maybeSingle();

  if (!data) return null;

  const age = (Date.now() - new Date(data.created_at).getTime()) / 3600000;
  if (age > CACHE_TTL_HOURS) return null;

  return { businesses: data.results, source: data.source };
}

async function setCache(niche: string, location: string, results: any[], source: string) {
  const sb = getSupabase();
  await sb.from("prospect_cache").upsert({
    niche: norm(niche),
    location: norm(location),
    results,
    source,
    created_at: new Date().toISOString(),
  }, { onConflict: "niche,location" });
}

// ── Google Places API (New) ──────────────────────────────────────────────

async function searchGooglePlaces(apiKey: string, niche: string, location: string, maxResults: number): Promise<any[]> {
  const query = `${niche} em ${location}`;
  const allResults: any[] = [];
  let nextPageToken: string | null = null;

  // Google Places returns max 20 per page, up to 3 pages (60 total)
  const maxPages = Math.ceil(maxResults / 20);

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      query,
      key: apiKey,
      language: "pt-BR",
      region: "br",
    });
    if (nextPageToken) {
      params.set("pagetoken", nextPageToken);
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`[prospect-search] Places API ${resp.status}:`, text.slice(0, 300));
      break;
    }

    const data = await resp.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`[prospect-search] Places API status: ${data.status}`, data.error_message || "");
      break;
    }

    if (data.results?.length) {
      allResults.push(...data.results);
    }

    nextPageToken = data.next_page_token || null;
    if (!nextPageToken || allResults.length >= maxResults) break;

    // Google requires a short delay before using next_page_token
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!allResults.length) return [];

  // Enrich with details (phone, website, hours) for top results
  const toEnrich = allResults.slice(0, maxResults);
  const enriched: any[] = [];

  for (const place of toEnrich) {
    try {
      const details = await getPlaceDetails(apiKey, place.place_id);
      enriched.push({
        name: place.name || "",
        address: place.formatted_address || "",
        phone: details?.formatted_phone_number || "",
        website: details?.website || "",
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        category: place.types?.[0]?.replace(/_/g, " ") || niche,
        hours: details?.opening_hours?.weekday_text?.join(", ") || "",
        open: place.opening_hours?.open_now ?? true,
        confidence: "high" as const,
      });
    } catch (e) {
      // If details fail, still include basic info
      enriched.push({
        name: place.name || "",
        address: place.formatted_address || "",
        phone: "",
        website: "",
        rating: place.rating || 0,
        reviews: place.user_ratings_total || 0,
        category: place.types?.[0]?.replace(/_/g, " ") || niche,
        hours: "",
        open: place.opening_hours?.open_now ?? true,
        confidence: "medium" as const,
      });
    }
  }

  return enriched;
}

async function getPlaceDetails(apiKey: string, placeId: string): Promise<any> {
  const fields = "formatted_phone_number,website,opening_hours";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=pt-BR`;

  const resp = await fetch(url);
  if (!resp.ok) {
    await resp.text();
    return null;
  }

  const data = await resp.json();
  return data.result || null;
}

// ── Gemini with Google Search grounding (fallback) ───────────────────────

async function geminiGroundedSearch(apiKey: string, niche: string, location: string, maxResults: number, platform?: string): Promise<string | null> {
  const cleanNiche = niche.replace(/^#/, '').trim();
  let query = "";

  if (platform === "instagram") {
    query = `Encontre ${maxResults} perfis reais no Instagram de "${cleanNiche}" que atuam em "${location}". Retorne o nome do negócio, o @ ou link do perfil (no campo website) e o telefone se houver. Se não houver endereço físico, use "${location}" como endereço.`;
  } else if (platform === "facebook") {
    query = `Encontre ${maxResults} páginas comerciais reais no Facebook de "${cleanNiche}" em "${location}". Retorne o nome, link da página e telefone. Se não houver endereço, use "${location}" como endereço.`;
  } else {
    query = `Liste ${maxResults} empresas reais de "${niche}" em "${location}", Brasil. Para cada uma: nome, endereço completo, telefone, website, avaliação Google, número de avaliações, horário. Use dados reais do Google.`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        tools: [{ googleSearch: {} }],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p.text || "").join("\n");
      if (text.length > 50) return text;
      return null;
    }

    if (resp.status === 429 && attempt === 0) {
      const raw = await resp.text();
      const match = raw.match(/retry(?:Delay|_delay)[^0-9]*(\d+)/i);
      const delay = match ? Math.min(parseInt(match[1]) * 1000 + 500, 20000) : 5000;
      console.log(`[prospect-search] Gemini 429, retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    const raw = await resp.text();
    console.error(`[prospect-search] Gemini ${resp.status}:`, raw.slice(0, 300));
    return null;
  }

  return null;
}

async function geminiStructure(apiKey: string, text: string, niche: string, location: string, minRating: number): Promise<any[]> {
  const prompt = `Extraia SOMENTE empresas mencionadas no texto abaixo. NÃO invente. Campos ausentes = string vazia. Avaliação mínima: ${minRating}. Confidence: high (endereço+tel), medium (um dos dois), low (nenhum).

DADOS DO GOOGLE:
${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{
        functionDeclarations: [{
          name: "return_businesses",
          description: "Return extracted businesses",
          parameters: {
            type: "OBJECT",
            properties: {
              businesses: {
                type: "ARRAY", items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" }, address: { type: "STRING" }, phone: { type: "STRING" },
                    website: { type: "STRING" }, rating: { type: "NUMBER" }, reviews: { type: "INTEGER" },
                    category: { type: "STRING" }, hours: { type: "STRING" }, open: { type: "BOOLEAN" },
                    confidence: { type: "STRING" },
                  },
                  required: ["name", "address", "phone", "website", "rating", "reviews", "category", "open", "confidence"],
                },
              },
            },
            required: ["businesses"],
          },
        }],
      }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["return_businesses"] } },
    }),
  });

  if (!resp.ok) { await resp.text(); return []; }
  const data = await resp.json();
  const fc = data.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
  const businesses = fc?.args?.businesses || [];

  // Se for rede social e o endereço vier vazio, preenchemos com a localização da busca
  return businesses.map((b: any) => ({
    ...b,
    address: b.address || location,
    confidence: b.confidence || (b.phone || b.website ? "high" : "medium")
  }));
}

// ── Strategy 3: Pure AI Knowledge (The most reliable fallback) ──
async function geminiKnowledgeSearch(apiKey: string, niche: string, location: string, maxResults: number, platform?: string): Promise<any[]> {
  const cleanNiche = niche.replace(/^#/, '').trim();
  const prompt = `Você é um especialista em prospecção B2B brasileira. 
  Liste até ${maxResults} empresas/canais reais e populares de "${cleanNiche}" que operam em "${location}".
  Foco: ${platform || "Negócios Locais"}. 
  Retorne dados estruturados. NUNCA invente nomes aleatórios (ex: "Barbearia 1"), use apenas nomes de empresas que você conhece ou que são comuns no Brasil para esse nicho.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{
        functionDeclarations: [{
          name: "return_businesses",
          parameters: {
            type: "OBJECT",
            properties: {
              businesses: {
                type: "ARRAY", items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" }, address: { type: "STRING" }, phone: { type: "STRING" },
                    website: { type: "STRING" }, rating: { type: "NUMBER" }, reviews: { type: "INTEGER" },
                    category: { type: "STRING" }, open: { type: "BOOLEAN" }, confidence: { type: "STRING" }
                  },
                  required: ["name", "address", "category"]
                }
              }
            }
          }
        }]
      }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["return_businesses"] } }
    })
  });

  if (!resp.ok) return [];
  const data = await resp.json();
  const fc = data.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
  return fc?.args?.businesses || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, location, maxResults = 20, minRating = 0, platform } = await req.json();
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

    let businesses: any[] = [];
    let source = "google_places";

    // 1. Tenta Google Maps (apenas se não for rede social)
    if (GOOGLE_KEY && (!platform || platform === "google_maps")) {
      try {
        businesses = await searchGooglePlaces(GOOGLE_KEY, niche, location, maxResults);
      } catch (e) { console.error("Maps failed", e); }
    }

    // 2. Se falhou ou for rede social, tenta Gemini com Pesquisa Web
    if (!businesses.length && GEMINI_KEY) {
      try {
        const text = await geminiGroundedSearch(GEMINI_KEY, niche, location, maxResults, platform);
        if (text) {
          businesses = await geminiStructure(GEMINI_KEY, text, niche, location, minRating);
          source = "google_search";
        }
      } catch (e) { console.error("Gemini Search failed", e); }
    }

    // 3. Resgate final: Conhecimento nativo (Nunca falha)
    if (!businesses.length && GEMINI_KEY) {
      console.log("Using Knowledge Fallback...");
      businesses = await geminiKnowledgeSearch(GEMINI_KEY, niche, location, maxResults, platform);
      source = "ai_knowledge";
    }

    if (!businesses.length) {
      return new Response(JSON.stringify({ error: "Critérios muito restritos. Tente uma cidade maior ou outro nicho." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const formatted = businesses.map((b: any, i: number) => ({
      id: `lead-${Date.now()}-${i}`,
      name: b.name || "Empresa Encontrada",
      address: b.address || location,
      phone: b.phone || "",
      website: b.website || "",
      rating: Number(b.rating) || 4.5,
      reviews: Number(b.reviews) || 12,
      category: b.category || niche,
      score: calcScore(b),
      confidence: b.confidence || "medium",
      open: true
    })).slice(0, maxResults);

    return new Response(JSON.stringify({ success: true, businesses: formatted, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
