// Public Coinbase spot quotes. Holdings are fictional; prices and valuations are not simulated.
// https://docs.cdp.coinbase.com/coinbase-business/track-apis/prices
export const HOLDINGS = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: .085, color: '#f5ac50', icon: 'B' },
  { symbol: 'ETH', name: 'Ethereum', quantity: 1.75, color: '#9bafff', icon: 'E' },
  { symbol: 'SOL', name: 'Solana', quantity: 24, color: '#89e5cd', icon: 'S' },
];
export const CASH = 1820.50;
export const CACHE_KEY = 'hiflyguy.portfolio.quotes.v1';
export const REFRESH_MS = 30000;
export const FRESH_MS = 90000;
export const usd = n => Number.isFinite(n) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '\u2014';
export function parsePrice(body, symbol) {
  const d = body?.data, value = Number(d?.amount);
  if (!d || d.currency !== 'USD' || (d.base && d.base !== symbol) || !Number.isFinite(value) || value <= 0 || value > 1e9) throw new Error('Invalid quote');
  return value;
}
export function valuation(quotes) {
  if (!HOLDINGS.every(h => Number.isFinite(quotes[h.symbol]?.price) && quotes[h.symbol].price > 0)) return null;
  return (Math.round(CASH * 100) + HOLDINGS.reduce((sum, h) => sum + Math.round(h.quantity * quotes[h.symbol].price * 100), 0)) / 100;
}
export function quoteState(quotes, failed = false, now = Date.now()) {
  const available = HOLDINGS.filter(h => quotes[h.symbol]);
  if (!available.length) return 'unavailable';
  if (available.length !== HOLDINGS.length) return 'partial';
  return !failed && available.every(h => now - quotes[h.symbol].at <= FRESH_MS) ? 'live' : 'cached';
}
export function restoreQuotes(raw, now = Date.now()) {
  const result = { quotes: {}, history: [] };
  try {
    const saved = JSON.parse(raw);
    for (const h of HOLDINGS) {
      const q = saved?.quotes?.[h.symbol];
      if (q && Number.isFinite(q.price) && q.price > 0 && q.price <= 1e9 && Number.isFinite(q.at) && q.at > 0 && q.at <= now) result.quotes[h.symbol] = { price: q.price, at: q.at };
    }
    if (Array.isArray(saved?.history)) result.history = saved.history.filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p?.date) && Date.parse(p.date) < now && HOLDINGS.every(h => Number.isFinite(p.prices?.[h.symbol]) && p.prices[h.symbol] > 0 && p.prices[h.symbol] <= 1e9)).slice(-7);
  } catch { /* Storage is optional. */ }
  return result;
}
export async function fetchPrice(symbol, date, fetcher = fetch) {
  const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 7000);
  try {
    const response = await fetcher(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot${date ? '?date=' + date : ''}`, { signal: abort.signal, credentials: 'omit', cache: 'no-store' });
    if (!response.ok) throw new Error('Quote unavailable');
    return parsePrice(await response.json(), symbol);
  } finally { clearTimeout(timeout); }
}
export async function fetchQuotes(fetcher = fetch) {
  const results = await Promise.allSettled(HOLDINGS.map(async h => ({ symbol: h.symbol, price: await fetchPrice(h.symbol, null, fetcher), at: Date.now() })));
  const quotes = {};
  for (const r of results) if (r.status === 'fulfilled') { const { symbol, ...quote } = r.value; quotes[symbol] = quote; }
  return { quotes, failed: results.some(r => r.status === 'rejected') };
}
export async function fetchHistory(existing, fetcher = fetch, now = Date.now()) {
  const history = [];
  const today = Date.parse(new Date(now).toISOString().slice(0, 10));
  // Three requests at a time, one daily snapshot at a time; no burst of 21 requests.
  for (let days = 7; days >= 1; days--) {
    const date = new Date(today - days * 86400000).toISOString().slice(0, 10);
    const cached = existing.find(p => p.date === date);
    if (cached) { history.push(cached); continue; }
    const results = await Promise.allSettled(HOLDINGS.map(h => fetchPrice(h.symbol, date, fetcher)));
    if (results.some(r => r.status === 'rejected')) return history;
    history.push({ date, prices: Object.fromEntries(HOLDINGS.map((h, i) => [h.symbol, results[i].value])) });
  }
  return history;
}
