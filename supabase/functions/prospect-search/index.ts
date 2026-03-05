import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_HOURS = 168; // 7 days

// ── Text / location helpers ──────────────────────────────────────────────

const STOP = new Set(["de","da","do","das","dos","e","em","na","no","bairro","cidade","estado","brasil"]);

function norm(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9\s,-]/g," ").replace(/\s+/g," ").trim();
}

function locTerms(loc: string) {
  const n = norm(loc); if(!n) return [];
  const seg = n.split(/[,-/]/).map(s=>s.trim()).filter(s=>s.length>=3);
  const wds = n.split(/\s+/).filter(w=>w.length>=3&&!STOP.has(w));
  return [...new Set([...seg,...wds])];
}

function locScore(addr: string, loc: string) {
  const a = norm(addr||""); if(!a) return 0;
  const t = locTerms(loc); if(!t.length) return 1;
  return t.reduce((s,x)=>(a.includes(x)?s+1:s),0);
}

function rankByLoc<T extends {address:string;score?:number}>(items:T[],loc:string):T[]{
  if(!items.length)return items;
  const r=items.map(i=>({i,l:locScore(i.address,loc)})).sort((a,b)=>b.l!==a.l?b.l-a.l:(b.i.score||0)-(a.i.score||0));
  const s=r.filter(x=>x.l>0);const m=Math.max(3,Math.ceil(r.length*0.4));
  return (s.length>=m?s:r).map(x=>x.i);
}

function calcScore(b:any){
  let s=0;if(b.phone)s+=20;if(b.website)s+=20;if(b.rating>0)s+=15;if(b.rating>=4)s+=10;if(b.reviews>50)s+=10;if(b.open)s+=10;if(b.hours)s+=10;if(b.confidence==="high")s+=5;return Math.min(s,100);
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

async function geminiGroundedSearch(apiKey: string, niche: string, location: string, maxResults: number): Promise<string | null> {
  const query = `Liste ${maxResults} empresas reais de "${niche}" em "${location}", Brasil. Para cada uma: nome, endereço completo, telefone, website, avaliação Google, número de avaliações, horário. Use dados reais do Google.`;

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
                    name:{type:"STRING"},address:{type:"STRING"},phone:{type:"STRING"},
                    website:{type:"STRING"},rating:{type:"NUMBER"},reviews:{type:"INTEGER"},
                    category:{type:"STRING"},hours:{type:"STRING"},open:{type:"BOOLEAN"},
                    confidence:{type:"STRING"},
                  },
                  required:["name","address","phone","website","rating","reviews","category","open","confidence"],
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
  const fc = data.candidates?.[0]?.content?.parts?.find((p:any)=>p.functionCall)?.functionCall;
  return fc?.args?.businesses || [];
}

// ── Lovable AI fallback (knowledge-based) ────────────────────────────────

async function lovableFallback(apiKey: string, niche: string, location: string, maxResults: number, minRating: number): Promise<any[]> {
  const prompt = `Você é um assistente de prospecção comercial. Liste até ${maxResults} empresas CONHECIDAS e POPULARES de "${niche}" em "${location}", Brasil.

REGRAS CRÍTICAS:
- Liste APENAS empresas que você tem CERTEZA que existem
- Se não conhecer empresas reais suficientes, liste MENOS — NUNCA invente
- Avaliação mínima: ${minRating}
- Confidence: "high" apenas se você tem CERTEZA dos dados, "medium" se parcial, "low" se incerto`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      tools: [{
        type: "function",
        function: {
          name: "return_businesses",
          description: "Return known real businesses",
          parameters: {
            type: "object",
            properties: {
              businesses: {
                type: "array", items: {
                  type: "object",
                  properties: {
                    name:{type:"string"},address:{type:"string"},phone:{type:"string"},
                    website:{type:"string"},rating:{type:"number"},reviews:{type:"integer"},
                    category:{type:"string"},hours:{type:"string"},open:{type:"boolean"},
                    confidence:{type:"string",enum:["high","medium","low"]},
                  },
                  required:["name","address","phone","website","rating","reviews","category","open","confidence"],
                  additionalProperties:false,
                },
              },
            },
            required:["businesses"],additionalProperties:false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_businesses" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`[prospect-search] Lovable AI ${resp.status}:`, text.slice(0, 200));
    if (resp.status === 429) throw new Error("Muitas requisições. Aguarde 1 minuto e tente novamente.");
    if (resp.status === 402) throw new Error("Créditos insuficientes.");
    throw new Error("Erro ao buscar dados");
  }

  const data = await resp.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return [];
  return JSON.parse(tc.function.arguments).businesses || [];
}

// ── Main ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, location, maxResults = 20, minRating = 0 } = await req.json();
    if (!niche || !location) {
      return new Response(JSON.stringify({ error: "Nicho e localização são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Check cache first ──
    const cached = await getCached(niche, location);
    if (cached) {
      console.log("[prospect-search] Cache hit!");
      return new Response(JSON.stringify({ success: true, businesses: cached.businesses, source: cached.source, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GOOGLE_MAPS_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    let businesses: any[] = [];
    let source = "ai_knowledge";

    // ── Strategy 1: Google Places API (real data) ──
    if (GOOGLE_MAPS_KEY) {
      console.log("[prospect-search] Trying Google Places API…");
      try {
        businesses = await searchGooglePlaces(GOOGLE_MAPS_KEY, niche, location, maxResults);
        if (businesses.length > 0) {
          source = "google_places";
          console.log(`[prospect-search] Places API returned ${businesses.length} results`);
        }
      } catch (e) {
        console.error("[prospect-search] Places API error:", e);
      }
    }

    // ── Strategy 2: Gemini + Google Search grounding ──
    if (!businesses.length && GEMINI_KEY) {
      console.log("[prospect-search] Trying Gemini Google Search grounding…");
      const groundedText = await geminiGroundedSearch(GEMINI_KEY, niche, location, maxResults);

      if (groundedText) {
        console.log("[prospect-search] Got grounded text, structuring…");
        const raw = await geminiStructure(GEMINI_KEY, groundedText, niche, location, minRating);
        if (raw.length > 0) {
          businesses = raw;
          source = "google_search";
        }
      }
    }

    // Lovable AI removida da prospecção — apenas Google Places e Gemini

    if (!businesses.length) {
      return new Response(JSON.stringify({ error: "Nenhuma empresa encontrada. Tente outro nicho ou localização." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Format & rank ──
    const formatted = rankByLoc(
      businesses
        .filter((b: any) => (Number(b.rating) || 0) >= minRating)
        .map((b: any, i: number) => ({
          id: `prospect-${Date.now()}-${i}`,
          name: b.name || "",
          address: b.address || "",
          phone: b.phone || "",
          website: b.website || "",
          rating: b.rating || 0,
          reviews: b.reviews || 0,
          category: b.category || niche,
          hours: b.hours || "",
          open: b.open ?? true,
          confidence: b.confidence || "medium",
          score: calcScore(b),
        })),
      location
    ).slice(0, maxResults);

    // ── Save to cache ──
    await setCache(niche, location, formatted, source).catch(e =>
      console.error("[prospect-search] Cache save failed:", e)
    );

    return new Response(JSON.stringify({ success: true, businesses: formatted, source }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[prospect-search] Error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    const status = msg.includes("429") || msg.includes("Aguarde") ? 429 : 500;
    return new Response(JSON.stringify({ error: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
