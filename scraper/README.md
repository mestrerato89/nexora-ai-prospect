# Nexora Google Maps Scraper v2.0 🎯

Scraper local de Google Maps com seletores robustos e fallbacks.

## Instalação

```bash
cd scraper
npm install
```

## Uso

```bash
npm start
```

Servidor em `http://localhost:3099`.

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/search` | Iniciar busca |
| `GET` | `/api/search/status?niche=X&location=Y` | Status (polling) |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/teste` | Teste automático (5 resultados) |
| `GET` | `/api/debug` | Debug info + último HTML capturado |
| `GET` | `/api/searches` | Histórico |

## Teste rápido

```bash
# Inicia servidor
npm start

# Em outro terminal, roda teste automático
curl http://localhost:3099/api/teste
```

O teste busca "pizzaria são paulo" e retorna 5 resultados com detalhes de quais campos foram extraídos.

## Como funciona

1. **Fase 1 - Scroll**: Navega até Google Maps, faz scroll no feed, coleta nomes dos cards via `a[aria-label]`
2. **Fase 2 - Enriquecimento**: Clica em cada card, espera o painel lateral abrir, extrai dados detalhados com múltiplos seletores fallback
3. **Cache**: Resultados salvos no SQLite por 7 dias

## Seletores (atualizados)

| Dado | Seletores (em ordem de prioridade) |
|------|-------------------------------------|
| Nome | `h1.DUwDvf`, `h1[class*="fontHeadlineLarge"]` |
| Endereço | `button[data-item-id="address"]`, `button[data-tooltip*="endereço"]` |
| Telefone | `button[data-item-id*="phone"]`, `button[data-tooltip*="telefone"]`, `a[href^="tel:"]` |
| Website | `a[data-item-id="authority"]`, `a[data-tooltip*="site"]` |
| Avaliação | `div.F7nice span`, `span.ceNzKf`, `div[role="img"]` |

## CAPTCHA

Se detectado, abre navegador visível para resolução manual. Após resolver, continua automaticamente.

## Debug

- Screenshots salvos automaticamente em caso de erro (`scraper/error-*.png`)
- `GET /api/debug` retorna último HTML capturado e status das buscas ativas
