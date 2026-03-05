const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "nexora_leads.db");

function getDB() {
  return new Database(DB_PATH);
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      website TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      category TEXT,
      hours TEXT,
      is_open INTEGER DEFAULT 1,
      search_term TEXT,
      search_city TEXT,
      extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Novo',
      notes TEXT,
      tags TEXT,
      score INTEGER DEFAULT 0,
      UNIQUE(name, address)
    );

    CREATE TABLE IF NOT EXISTS search_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_key TEXT UNIQUE NOT NULL,
      results_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_search ON leads(search_term, search_city);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_cache_key ON search_cache(search_key);
  `);

  db.close();
  console.log("[DB] Banco inicializado:", DB_PATH);
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
  const db = getDB();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO leads (name, address, phone, website, rating, reviews, category, hours, is_open, search_term, search_city, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const saved = [];
  const insertMany = db.transaction((items) => {
    for (const lead of items) {
      const score = calculateScore(lead);
      const result = insert.run(
        lead.name, lead.address || "", lead.phone || "", lead.website || "",
        lead.rating || 0, lead.reviews || 0, lead.category || "",
        lead.hours || "", lead.open ? 1 : 0, searchTerm, searchCity, score
      );
      saved.push({
        ...lead,
        id: `local-${result.lastInsertRowid || Date.now()}-${saved.length}`,
        score,
        confidence: lead.phone || lead.website ? "high" : "medium",
      });
    }
  });

  insertMany(leads);
  db.close();

  console.log(`[DB] ${saved.length} leads salvos`);
  return saved;
}

function getSearchCache(searchKey, maxAgeHours) {
  const db = getDB();
  const row = db.prepare(`
    SELECT results_json, created_at FROM search_cache 
    WHERE search_key = ? 
    AND created_at > datetime('now', ?)
  `).get(searchKey, `-${maxAgeHours} hours`);
  db.close();

  if (row) {
    try { return JSON.parse(row.results_json); } catch { return null; }
  }
  return null;
}

function saveSearchCache(searchKey, results) {
  const db = getDB();
  db.prepare(`
    INSERT OR REPLACE INTO search_cache (search_key, results_json, created_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(searchKey, JSON.stringify(results));
  db.close();
}

module.exports = { initDB, saveLeads, getSearchCache, saveSearchCache };
