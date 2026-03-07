const express = require("express");
const cors = require("cors");
const { scrapeGoogleMaps, getDebugInfo } = require("./scraper");
const { initDB, saveLeads, getSearchCache, saveSearchCache } = require("./database");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3099;
const CACHE_TTL_HOURS = 168; // 7 dias

const activeSearches = new Map();

const LOCATION_STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "na", "no", "bairro", "cidade", "estado", "brasil",
]);

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLocationTerms(location) {
  const normalized = normalizeText(location);
  if (!normalized) return [];

  const segments = normalized
    .split(/[,-/]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const words = normalized
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !LOCATION_STOPWORDS.has(w));

  return [...new Set([...segments, ...words])];
}

function getLocationMatchScore(address, location) {
  const normalizedAddress = normalizeText(address);
  if (!normalizedAddress) return 0;

  const terms = buildLocationTerms(location);
  if (!terms.length) return 1;

  return terms.reduce((score, term) => (normalizedAddress.includes(term) ? score + 1 : score), 0);
}

function rankResultsByLocation(results, location) {
  return results
    .map((result) => ({ ...result, __locationScore: getLocationMatchScore(result.address || "", location) }))
    .sort((a, b) => {
      if (b.__locationScore !== a.__locationScore) return b.__locationScore - a.__locationScore;
      return (b.score || 0) - (a.score || 0);
    });
}

initDB();

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), activeSearches: activeSearches.size });
});

// Debug endpoint
app.get("/api/debug", (req, res) => {
  const debug = getDebugInfo();
  res.json({
    lastScreenshot: debug.lastScreenshot,
    lastHtmlLength: debug.lastHtml?.length || 0,
    lastHtmlPreview: debug.lastHtml?.substring(0, 500) || "",
    activeSearches: Array.from(activeSearches.entries()).map(([k, v]) => ({
      key: k,
      status: v.status,
      results: v.results?.length || 0,
    })),
  });
});

// Test endpoint
app.get("/api/teste", async (req, res) => {
  console.log("\n[TESTE] Iniciando teste com 'pizzaria são paulo' (5 resultados)...\n");
  try {
    const results = await scrapeGoogleMaps("pizzaria", "são paulo", 5, (partial) => {
      console.log(`[TESTE] Progresso: ${partial.length} resultados`);
    });

    const summary = results.map((r) => ({
      nome: r.name,
      endereco: r.address || "❌",
      telefone: r.phone || "❌",
      website: r.website || "❌",
      avaliacao: r.rating || "❌",
      reviews: r.reviews || 0,
      score: r.score,
      confidence: r.confidence,
    }));

    console.log("\n[TESTE] ═══ RESULTADO DO TESTE ═══");
    console.table(summary);

    res.json({
      success: true,
      total: results.length,
      results: summary,
      fieldsExtracted: {
        withPhone: results.filter((r) => r.phone).length,
        withWebsite: results.filter((r) => r.website).length,
        withAddress: results.filter((r) => r.address).length,
        withRating: results.filter((r) => r.rating > 0).length,
      },
    });
  } catch (err) {
    console.error("[TESTE] FALHOU:", err.message);
    const debug = getDebugInfo();
    res.status(500).json({
      success: false,
      error: err.message,
      debug: { lastScreenshot: debug.lastScreenshot, lastHtmlLength: debug.lastHtml?.length || 0 },
    });
  }
});

// Search
app.post("/api/search", async (req, res) => {
  const { niche, location, maxResults = 20 } = req.body;

  if (!niche || !location) {
    return res.status(400).json({ error: "niche e location são obrigatórios" });
  }

  const searchKey = `v2::${niche}::${location}`.toLowerCase();

  // Cache
  const cached = getSearchCache(searchKey, CACHE_TTL_HOURS);
  if (cached) {
    console.log(`[CACHE] ${cached.length} resultados do cache para "${searchKey}"`);
    return res.json({ success: true, businesses: cached, fromCache: true });
  }

  if (activeSearches.has(searchKey)) {
    return res.status(409).json({ error: "Busca já em andamento" });
  }

  const searchId = Date.now().toString();
  activeSearches.set(searchKey, { id: searchId, status: "searching", results: [], startedAt: new Date() });

  res.json({ success: true, searchId, message: "Busca iniciada" });

  try {
    const results = await scrapeGoogleMaps(niche, location, maxResults, (partial) => {
      const search = activeSearches.get(searchKey);
      if (search) {
        search.results = partial;
        search.status = `Encontrados ${partial.length} resultados...`;
      }
    });

    const ranked = rankResultsByLocation(results, location);
    const strictMatches = ranked.filter((item) => item.__locationScore > 0);
    const minStrict = Math.max(3, Math.ceil(Math.min(maxResults, ranked.length) * 0.4));
    const selected = (strictMatches.length >= minStrict ? strictMatches : ranked)
      .slice(0, maxResults)
      .map(({ __locationScore, ...item }) => item);

    const saved = saveLeads(selected, niche, location);
    saveSearchCache(searchKey, selected);

    activeSearches.set(searchKey, { id: searchId, status: "done", results: saved, total: saved.length });
    console.log(`[OK] ${saved.length} empresas para "${niche}" em "${location}" (${strictMatches.length} com match de localização)`);

    setTimeout(() => activeSearches.delete(searchKey), 5 * 60 * 1000);
  } catch (err) {
    console.error(`[ERRO] Busca falhou:`, err.message);
    activeSearches.set(searchKey, {
      id: searchId,
      status: "error",
      error: err.message,
      results: activeSearches.get(searchKey)?.results || [],
    });
    setTimeout(() => activeSearches.delete(searchKey), 5 * 60 * 1000);
  }
});

// Status
app.get("/api/search/status", (req, res) => {
  const { niche, location } = req.query;
  const searchKey = `v2::${niche}::${location}`.toLowerCase();
  const search = activeSearches.get(searchKey);
  if (!search) return res.json({ status: "idle", results: [] });
  res.json(search);
});

// History
app.get("/api/searches", (req, res) => {
  const { __getMemoryDB } = require("./database");
  const db = __getMemoryDB();

  const map = new Map();
  db.leads.forEach(l => {
    const key = `${l.search_term}::${l.search_city}`;
    if (!map.has(key)) {
      map.set(key, { search_term: l.search_term, search_city: l.search_city, total: 0, last_search: l.extracted_at });
    }
    const val = map.get(key);
    val.total++;
    if (new Date(l.extracted_at) > new Date(val.last_search)) val.last_search = l.extracted_at;
  });

  res.json(Array.from(map.values()).sort((a, b) => new Date(b.last_search) - new Date(a.last_search)));
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🎯 Rataria Google Maps Scraper v2.0              ║
║   http://localhost:${PORT}                          ║
║                                                   ║
║   POST /api/search       - Iniciar busca          ║
║   GET  /api/search/status - Status da busca       ║
║   GET  /api/health       - Health check           ║
║   GET  /api/teste        - Teste automático       ║
║   GET  /api/debug        - Debug info             ║
╚═══════════════════════════════════════════════════╝
  `);
});
