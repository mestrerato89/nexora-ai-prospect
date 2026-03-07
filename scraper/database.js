const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, "nexora_leads_db.json");

let memoryDB = {
  leads: [],
  search_cache: []
};

function initDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      memoryDB = JSON.parse(data);
    } catch (e) {
      console.error("[DB] Failed to load JSON DB", e);
    }
  } else {
    saveDB();
  }
  console.log("[DB] Banco inicializado:", DB_PATH);
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryDB, null, 2));
  } catch (e) {
    console.error("[DB] Failed to save JSON DB", e);
  }
}

function calculateScore(lead) {
  let score = 0;
  if (lead.phone) score += 20;
  if (lead.website) score += 20;
  if (lead.rating > 0) score += 15;
  if (lead.rating >= 4.0) score += 10;
  if (lead.reviews > 50) score += 10;
  if (lead.is_open) score += 10;
  if (lead.hours) score += 10;
  if (lead.category) score += 5;
  return Math.min(score, 100);
}

function saveLeads(leads, searchTerm, searchCity) {
  const saved = [];

  for (const lead of leads) {
    const score = calculateScore(lead);

    // Check if exists
    const exists = memoryDB.leads.find(l => l.name === lead.name && l.address === (lead.address || ""));
    if (!exists) {
      const newLead = {
        id: `local-${Date.now()}-${memoryDB.leads.length}`,
        name: lead.name,
        address: lead.address || "",
        phone: lead.phone || "",
        website: lead.website || "",
        rating: lead.rating || 0,
        reviews: lead.reviews || 0,
        category: lead.category || "",
        hours: lead.hours || "",
        is_open: lead.open ? 1 : 0,
        search_term: searchTerm,
        search_city: searchCity,
        score: score,
        extracted_at: new Date().toISOString()
      };
      memoryDB.leads.push(newLead);

      saved.push({
        ...lead,
        id: newLead.id,
        score,
        confidence: lead.phone || lead.website ? "high" : "medium",
      });
    }
  }

  saveDB();
  console.log(`[DB] ${saved.length} leads salvos`);
  return saved;
}

function getSearchCache(searchKey, maxAgeHours) {
  const cache = memoryDB.search_cache.find(c => c.search_key === searchKey);
  if (!cache) return null;

  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const age = Date.now() - new Date(cache.created_at).getTime();

  if (age > maxAgeMs) return null;

  try {
    return JSON.parse(cache.results_json);
  } catch {
    return null;
  }
}

function saveSearchCache(searchKey, results) {
  let cache = memoryDB.search_cache.find(c => c.search_key === searchKey);
  if (cache) {
    cache.results_json = JSON.stringify(results);
    cache.created_at = new Date().toISOString();
  } else {
    memoryDB.search_cache.push({
      search_key: searchKey,
      results_json: JSON.stringify(results),
      created_at: new Date().toISOString()
    });
  }
  saveDB();
}

function __getMemoryDB() {
  return memoryDB;
}

module.exports = { initDB, saveLeads, getSearchCache, saveSearchCache, __getMemoryDB };
