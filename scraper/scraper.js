const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");

puppeteer.use(StealthPlugin());

const SCROLL_DELAY = 2500;
const CLICK_DELAY = 3500;
const MAX_NO_NEW_RESULTS = 3;

let lastDebugHtml = "";
let lastScreenshotPath = "";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function saveDebugScreenshot(page, label = "debug") {
  try {
    const p = path.join(__dirname, `${label}-${Date.now()}.png`);
    await page.screenshot({ path: p, fullPage: false });
    lastScreenshotPath = p;
    console.log(`[DEBUG] Screenshot salvo: ${p}`);
  } catch (e) {
    console.log(`[DEBUG] Erro ao salvar screenshot: ${e.message}`);
  }
}

async function saveDebugHtml(page) {
  try {
    lastDebugHtml = await page.content();
  } catch {}
}

async function handleCookieConsent(page) {
  try {
    const selectors = [
      'button[aria-label*="Aceitar"]',
      'button[aria-label*="Accept"]',
      'form[action*="consent"] button',
    ];
    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await sleep(2000);
        console.log("[SCRAPER] Cookies aceitos");
        return;
      }
    }
    // Try by text content
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        const t = b.textContent?.toLowerCase() || "";
        if (t.includes("aceitar tudo") || t.includes("accept all") || t.includes("concordo")) {
          b.click();
          return true;
        }
      }
      return false;
    });
    if (clicked) {
      await sleep(2000);
      console.log("[SCRAPER] Cookies aceitos (por texto)");
    }
  } catch {}
}

async function detectCaptcha(page) {
  return page.evaluate(() => {
    return (
      document.querySelector('iframe[src*="recaptcha"]') !== null ||
      document.body.innerText.includes("confirme que você não é um robô") ||
      document.body.innerText.includes("unusual traffic") ||
      document.body.innerText.includes("sistemas detectaram tráfego incomum")
    );
  });
}

async function handleCaptcha(page, browser, url) {
  console.log("[SCRAPER] ⚠️ CAPTCHA detectado! Abrindo navegador visível...");
  await browser.close();

  const visibleBrowser = await puppeteer.launch({
    headless: false,
    args: ["--window-size=1920,1080"],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const visiblePage = await visibleBrowser.newPage();
  await visiblePage.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  await visiblePage.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  console.log("[SCRAPER] 👆 Resolva o CAPTCHA no navegador. Aguardando até 5 min...");
  await visiblePage.waitForSelector('div[role="feed"]', { timeout: 300000 });
  console.log("[SCRAPER] ✅ CAPTCHA resolvido!");

  return { browser: visibleBrowser, page: visiblePage };
}

// ═══════════════════════════════════════════
// EXTRACTION HELPERS — multiple fallback selectors
// ═══════════════════════════════════════════

/**
 * Try selectors in order, return first text match or null
 */
async function extractText(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (!el) continue;
      const txt = await el.evaluate((e) => e.textContent?.trim());
      if (txt && txt.length > 1) return txt;
    } catch {}
  }
  return null;
}

/**
 * Try selectors in order, return first href or null
 */
async function extractHref(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (!el) continue;
      const href = await el.evaluate((e) => e.getAttribute("href"));
      if (href && href.trim()) return href.trim();
    } catch {}
  }
  return null;
}

// ═══════════════════════════════════════════
// MAIN SCRAPE FUNCTION
// ═══════════════════════════════════════════

async function scrapeGoogleMaps(niche, location, maxResults = 20, onProgress = () => {}) {
  console.log(`\n[SCRAPER] ═══════════════════════════════════════`);
  console.log(`[SCRAPER] Buscando "${niche}" em "${location}" (máx: ${maxResults})`);
  console.log(`[SCRAPER] ═══════════════════════════════════════\n`);

  let browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  let page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  await page.emulateTimezone("America/Sao_Paulo");

  // Block images/fonts for speed
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "font", "media"].includes(type)) req.abort();
    else req.continue();
  });

  const searchQuery = encodeURIComponent(`${niche} ${location}`);
  const url = `https://www.google.com/maps/search/${searchQuery}`;

  try {
    console.log(`[SCRAPER] Acessando: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("[SCRAPER] Página carregada");

    await handleCookieConsent(page);

    if (await detectCaptcha(page)) {
      const result = await handleCaptcha(page, browser, url);
      browser = result.browser;
      page = result.page;
    }

    // Wait for feed
    try {
      await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
      console.log("[SCRAPER] Feed de resultados carregado ✓");
    } catch {
      console.log("[SCRAPER] Feed não encontrado, tentando alternativo...");
      await saveDebugScreenshot(page, "no-feed");
      await saveDebugHtml(page);
      try {
        await page.waitForSelector('div[role="article"]', { timeout: 5000 });
      } catch {
        throw new Error("Feed de resultados não encontrado. Possível bloqueio.");
      }
    }

    // Phase 1: Scroll and collect card names
    console.log("[SCRAPER] Fase 1: Scrolling e coletando cards...");
    const cardNames = await scrollAndCollectCards(page, maxResults, onProgress);
    console.log(`[SCRAPER] ${cardNames.length} cards únicos encontrados`);

    if (cardNames.length === 0) {
      await saveDebugScreenshot(page, "no-cards");
      await saveDebugHtml(page);
      throw new Error("Nenhum card encontrado.");
    }

    // Phase 2: Click each card and extract details from side panel
    console.log("[SCRAPER] Fase 2: Enriquecendo dados (clicando em cada card)...");
    const results = await enrichCards(page, cardNames, maxResults, onProgress);

    console.log(`\n[SCRAPER] ═══ RESULTADO FINAL: ${results.length} empresas ═══\n`);
    return results;
  } catch (err) {
    console.error(`[SCRAPER] ERRO: ${err.message}`);
    await saveDebugScreenshot(page, "error");
    await saveDebugHtml(page);
    throw err;
  } finally {
    try { await browser.close(); } catch {}
  }
}

// ═══════════════════════════════════════════
// PHASE 1: SCROLL & COLLECT
// ═══════════════════════════════════════════

async function scrollAndCollectCards(page, maxResults, onProgress) {
  const feedSelector = 'div[role="feed"]';
  let noNewCount = 0;
  let previousCount = 0;
  const collectedNames = new Set();

  while (collectedNames.size < maxResults && noNewCount < MAX_NO_NEW_RESULTS) {
    // Smooth scroll inside the feed panel
    await page.evaluate((sel) => {
      const feed = document.querySelector(sel);
      if (feed) feed.scrollBy({ top: 800, behavior: "smooth" });
    }, feedSelector);

    await sleep(SCROLL_DELAY);

    // Check end of list
    const endOfList = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("Você chegou ao fim da lista") ||
        text.includes("You've reached the end of the list")
      );
    });
    if (endOfList) {
      console.log("[SCRAPER] Fim da lista detectado");
      break;
    }

    // Collect unique card names via aria-label on feed links
    const names = await page.evaluate(() => {
      const links = document.querySelectorAll('div[role="feed"] a[aria-label]');
      return Array.from(links)
        .map((a) => a.getAttribute("aria-label"))
        .filter((n) => n && n.length > 2);
    });

    for (const n of names) collectedNames.add(n);

    if (collectedNames.size === previousCount) {
      noNewCount++;
    } else {
      noNewCount = 0;
    }
    previousCount = collectedNames.size;
    console.log(`[SCRAPER] Scroll: ${collectedNames.size} cards`);

    // Partial progress
    const partial = Array.from(collectedNames).slice(0, maxResults).map((name, i) => ({
      id: `temp-${i}`,
      name,
      address: "",
      phone: "",
      website: "",
      rating: 0,
      reviews: 0,
      category: "",
      hours: "",
      open: true,
      score: 0,
      confidence: "low",
    }));
    onProgress(partial);
  }

  return Array.from(collectedNames).slice(0, maxResults);
}

// ═══════════════════════════════════════════
// PHASE 2: ENRICH EACH CARD (side panel)
// ═══════════════════════════════════════════

async function enrichCards(page, cardNames, maxResults, onProgress) {
  const results = [];
  const total = Math.min(cardNames.length, maxResults);

  for (let i = 0; i < total; i++) {
    const name = cardNames[i];
    console.log(`[SCRAPER] [${i + 1}/${total}] Extraindo: ${name}`);

    try {
      // Click on the card
      const clicked = await page.evaluate((targetName) => {
        const links = document.querySelectorAll('div[role="feed"] a[aria-label]');
        for (const link of links) {
          if (link.getAttribute("aria-label") === targetName) {
            link.click();
            return true;
          }
        }
        return false;
      }, name);

      if (!clicked) {
        console.log(`[SCRAPER]   ⚠ Card "${name}" não encontrado, pulando`);
        continue;
      }

      await sleep(CLICK_DELAY);

      // Wait for detail panel header
      const headerLoaded = await Promise.race([
        page.waitForSelector("h1.DUwDvf", { timeout: 8000 }).then(() => true),
        page.waitForSelector('h1[class*="fontHeadlineLarge"]', { timeout: 8000 }).then(() => true),
        sleep(8000).then(() => false),
      ]);

      if (!headerLoaded) {
        console.log(`[SCRAPER]   ⚠ Painel não abriu para "${name}", pulando`);
        await goBackToList(page);
        continue;
      }

      // Extract all details from the side panel
      const details = await page.evaluate(() => {
        const data = {
          name: "",
          address: "",
          phone: "",
          website: "",
          rating: 0,
          reviews: 0,
          category: "",
          hours: "",
          open: true,
        };

        // ── Name ──
        // Selectors in priority order
        const nameSelectors = [
          "h1.DUwDvf.fontHeadlineLarge span",
          "h1.DUwDvf.fontHeadlineLarge",
          "h1.DUwDvf",
          'h1[class*="fontHeadlineLarge"]',
        ];
        for (const sel of nameSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.trim()) {
            data.name = el.textContent.trim();
            break;
          }
        }

        // ── Rating ──
        const ratingSelectors = [
          'div.F7nice span[aria-hidden="true"]',
          'span[class*="fontDisplayLarge"]',
          'span.ceNzKf',
          'div[role="img"][aria-label*="estrela"]',
          'div[role="img"][aria-label*="star"]',
        ];
        for (const sel of ratingSelectors) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const text = el.getAttribute("aria-label") || el.textContent || "";
          const m = text.match(/([\d,\.]+)/);
          if (m) {
            data.rating = parseFloat(m[1].replace(",", "."));
            break;
          }
        }

        // ── Reviews count ──
        const reviewSelectors = [
          'span[aria-label*="avalia"]',
          'span[aria-label*="review"]',
          "div.F7nice span:last-child",
        ];
        for (const sel of reviewSelectors) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const text = el.textContent || el.getAttribute("aria-label") || "";
          const m = text.match(/([\d\.]+)/);
          if (m) {
            data.reviews = parseInt(m[1].replace(/\./g, ""));
            break;
          }
        }

        // ── Category ──
        const catSelectors = [
          'button[jsaction*="category"]',
          "span.DkEaL",
          "div.LBgpps button",
        ];
        for (const sel of catSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.trim()) {
            data.category = el.textContent.trim();
            break;
          }
        }

        // ── Address ──
        const addrSelectors = [
          'button[data-item-id="address"]',
          'button[data-tooltip*="endereço"]',
          'button[data-tooltip*="address"]',
        ];
        for (const sel of addrSelectors) {
          const el = document.querySelector(sel);
          if (!el) continue;
          const text = el.textContent?.trim()?.replace(/^Endereço:\s*/i, "");
          if (text && text.length > 5) {
            data.address = text;
            break;
          }
        }
        // Fallback: any button with address-like data-item-id
        if (!data.address) {
          const btns = document.querySelectorAll("button[data-item-id]");
          for (const btn of btns) {
            const id = btn.getAttribute("data-item-id") || "";
            if (id.includes("address") || id.includes("oloc")) {
              const t = btn.textContent?.trim();
              if (t && t.length > 5) {
                data.address = t;
                break;
              }
            }
          }
        }

        // ── Phone ──
        const phoneSelectors = [
          'button[data-item-id*="phone"]',
          'button[data-tooltip*="telefone"]',
          'button[data-tooltip*="phone"]',
          'a[href^="tel:"]',
        ];
        for (const sel of phoneSelectors) {
          const el = document.querySelector(sel);
          if (!el) continue;
          if (el.tagName === "A") {
            data.phone = el.getAttribute("href")?.replace("tel:", "") || "";
          } else {
            // Try aria-label first (cleaner)
            const label = el.getAttribute("aria-label") || "";
            const phoneMatch = label.match(/[\d()+\-\s]{8,}/);
            if (phoneMatch) {
              data.phone = phoneMatch[0].trim();
            } else {
              // Fallback to text content
              const txt = el.textContent?.trim() || "";
              const m2 = txt.match(/[\d()+\-\s]{8,}/);
              data.phone = m2 ? m2[0].trim() : txt;
            }
          }
          if (data.phone) break;
        }

        // ── Website ──
        const webSelectors = [
          'a[data-item-id="authority"]',
          'a[data-tooltip*="site"]',
          'a[data-tooltip*="website"]',
        ];
        for (const sel of webSelectors) {
          const el = document.querySelector(sel);
          if (!el) continue;
          let href = el.getAttribute("href") || "";
          // Unwrap Google redirect
          if (href.includes("google.com/url")) {
            const m = href.match(/url=([^&]+)/);
            if (m) href = decodeURIComponent(m[1]);
          }
          if (href) {
            data.website = href;
            break;
          }
        }

        // ── Hours ──
        const hoursEl =
          document.querySelector('button[data-item-id*="oh"] div.fontBodyMedium') ||
          document.querySelector('[aria-label*="horário"]') ||
          document.querySelector('button[data-item-id*="oh"]');
        if (hoursEl) {
          const t = hoursEl.textContent?.trim() || "";
          if (t.length < 100) data.hours = t;
        }

        // ── Open/Closed ──
        const bodyText = document.body.innerText;
        if (
          bodyText.includes("Fechado permanentemente") ||
          bodyText.includes("Permanently closed")
        ) {
          data.open = false;
        } else if (bodyText.includes("Fechado") && !bodyText.includes("Aberto")) {
          data.open = false;
        }

        return data;
      });

      // Fallback name
      if (!details.name) details.name = name;

      const fieldsFound = [
        details.address && "endereço",
        details.phone && "telefone",
        details.website && "website",
        details.rating && "avaliação",
      ].filter(Boolean);

      console.log(
        `[SCRAPER]   ✓ Extraído: ${details.name} | Tel: ${details.phone || "—"} | Web: ${details.website || "—"} | ${fieldsFound.join(", ") || "dados básicos"}`
      );

      results.push({
        ...details,
        id: `gm-${Date.now()}-${i}`,
        score: calculateScore(details),
        confidence: details.phone || details.website ? "high" : details.address ? "medium" : "low",
      });

      onProgress([...results]);

      await goBackToList(page);
    } catch (err) {
      console.log(`[SCRAPER]   ✗ Falhou: "${name}" - erro: ${err.message}`);
    }
  }

  return results;
}

async function goBackToList(page) {
  try {
    const backBtn = await page.$('button[aria-label*="Voltar"], button[aria-label*="Back"]');
    if (backBtn) {
      await backBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await sleep(1500);
    try {
      await page.waitForSelector('div[role="feed"]', { timeout: 5000 });
    } catch {}
  } catch {}
}

function calculateScore(lead) {
  let score = 0;
  if (lead.phone) score += 25;
  if (lead.website) score += 25;
  if (lead.rating > 0) score += 10;
  if (lead.rating >= 4.0) score += 10;
  if (lead.reviews > 50) score += 10;
  if (lead.address) score += 10;
  if (lead.open !== false) score += 5;
  if (lead.category) score += 5;
  return Math.min(score, 100);
}

function getDebugInfo() {
  return { lastHtml: lastDebugHtml, lastScreenshot: lastScreenshotPath };
}

module.exports = { scrapeGoogleMaps, getDebugInfo };
