import { HOLDINGS, CASH, CACHE_KEY, REFRESH_MS, usd, valuation, quoteState, restoreQuotes, fetchQuotes, fetchHistory } from './portfolio-data.js';

export function createPortfolio(host) {
  const root = document.createElement('section'); root.id = 'portfolio'; root.hidden = true; root.setAttribute('aria-label', 'FlyGuy demo crypto portfolio');
  root.innerHTML = `<div class="wallet-head"><span class="wallet-emblem" aria-hidden="true">&#9671;</span><div class="wallet-wordmark">ASTER WALLET<small>FLYGUY / PERSONAL PORTFOLIO</small></div><span class="wallet-demo" title="Fictional holdings valued using public market quotes">Demo portfolio</span><button class="wallet-exit" id="wallet-exit" aria-label="Return to charts">&#8599;</button></div>
    <nav class="wallet-nav" aria-label="Portfolio views" role="tablist"><button id="wallet-overview" data-view="overview" role="tab" aria-selected="true" aria-controls="wallet-panel">Overview</button><button id="wallet-allocation" data-view="allocation" role="tab" aria-selected="false" aria-controls="wallet-panel">Allocation</button><button id="wallet-activity" data-view="activity" role="tab" aria-selected="false" aria-controls="wallet-panel">Activity</button></nav>
    <div class="wallet-grid"><div id="wallet-panel" class="wallet-panel" role="tabpanel"></div><aside class="wallet-assets"><div class="wallet-assets-title">Your assets<span>3 POSITIONS</span></div>${HOLDINGS.map(h => `<button class="wallet-asset" data-asset="${h.symbol}" aria-pressed="false"><span class="coin-badge" style="--coin:${h.color}">${h.icon}</span><span class="coin-name">${h.name}<small>${h.quantity} ${h.symbol}</small></span><span class="coin-value"><span id="value-${h.symbol}">&#8212;</span><small id="quote-${h.symbol}">Awaiting quote</small></span></button>`).join('')}<div class="wallet-cash"><div>Buying power<small>Demo USD balance</small></div><strong>${usd(CASH)}</strong></div></aside></div>
    <div class="wallet-source" id="wallet-source" data-state="unavailable"><i></i><span class="wallet-live-status" id="wallet-quote-status" role="status">Connecting to Coinbase quotes</span><a href="https://www.coinbase.com/explore" target="_blank" rel="noopener noreferrer">Market prices &#8599;</a></div>`;
  host.append(root);
  const $ = s => root.querySelector(s);
  let saved; try { saved = localStorage.getItem(CACHE_KEY); } catch {}
  let { quotes, history } = restoreQuotes(saved);
  let view = 'overview', selected = 'BTC', failed = false, fetching = false, historyBusy = false, historyAttemptDay = '', lastFetch = 0;
  const activity = [];
  const save = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ quotes, history })); } catch {} };
  const record = text => { activity.unshift({ text, at: Date.now() }); activity.length = Math.min(activity.length, 12); };
  const timestamp = at => new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
  const nav = next => { view = next; record(next === 'allocation' ? 'Reviewed asset allocation' : next === 'activity' ? 'Opened session activity' : 'Reviewed portfolio balance'); render(); };
  root.querySelectorAll('[data-view]').forEach(b => b.onclick = () => nav(b.dataset.view));
  root.querySelectorAll('[data-asset]').forEach(b => b.onclick = () => { selected = b.dataset.asset; view = 'detail'; record('Inspected ' + HOLDINGS.find(h => h.symbol === selected).name); render(); });
  $('#wallet-exit').onclick = () => show(false);

  function series(symbol) {
    const points = history.map(p => ({ at: Date.parse(p.date), value: symbol ? p.prices[symbol] : valuation(Object.fromEntries(HOLDINGS.map(h => [h.symbol, { price: p.prices[h.symbol] }]))) }));
    const value = symbol ? quotes[symbol]?.price : valuation(quotes);
    if (Number.isFinite(value)) points.push({ at: Date.now(), value });
    return points;
  }
  function chart(symbol) {
    const points = series(symbol);
    if (points.length < 2) return `<div class="wallet-chart"><div class="wallet-chart-empty">${fetching || historyBusy ? 'Loading market history' : 'Price history unavailable'}</div></div><div class="wallet-chart-note"><span>7D / DAILY QUOTES</span><span>No synthetic price data</span></div>`;
    const values = points.map(p => p.value), low = Math.min(...values), high = Math.max(...values), span = high - low || high * .01 || 1;
    const start = points[0].at, duration = points.at(-1).at - start || 1;
    const coords = points.map(p => `${(6 + (p.at - start) / duration * 388).toFixed(1)},${(76 - (p.value - low) / span * 65).toFixed(1)}`);
    const path = 'M' + coords.join(' L'), color = values.at(-1) >= values[0] ? '#b4ef83' : '#eda399';
    return `<div class="wallet-chart"><svg viewBox="0 0 400 90" preserveAspectRatio="none" role="img" aria-label="${symbol || 'Fixed demo holdings'} valuation from public daily quotes"><defs><linearGradient id="wallet-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="M0 27H400 M0 53H400 M0 80H400" stroke="#2c4233" stroke-width=".5" stroke-dasharray="2 5"/><path d="${path} L394 90 L6 90Z" fill="url(#wallet-fill)"/><path d="${path}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="394" cy="${coords.at(-1).split(',')[1]}" r="3" fill="${color}"/></svg></div><div class="wallet-chart-note"><span>${symbol ? '7D / DAILY SPOT PRICES' : '7D / FIXED DEMO HOLDINGS'}</span><span>${points[0] ? new Date(points[0].at).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}) : ''} &mdash; latest</span></div>`;
  }
  function change(symbol) {
    const current = symbol ? quotes[symbol]?.price : valuation(quotes), prior = history.at(-1);
    const previous = prior && (symbol ? prior.prices[symbol] : valuation(Object.fromEntries(HOLDINGS.map(h => [h.symbol, { price: prior.prices[h.symbol] }]))));
    if (!Number.isFinite(current) || !previous) return '<div class="wallet-change"><span>Valued from public market quotes</span></div>';
    const delta = current - previous;
    return `<div class="wallet-change ${delta < 0 ? 'negative' : ''}">${delta >= 0 ? '+' : '-'}${usd(Math.abs(delta))} (${delta >= 0 ? '+' : ''}${(delta / previous * 100).toFixed(2)}%)<span>vs ${prior.date}</span></div>`;
  }
  function render() {
    const total = valuation(quotes), state = quoteState(quotes, failed);
    root.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === (view === 'detail' ? 'overview' : view))));
    $('#wallet-panel').setAttribute('aria-labelledby', 'wallet-' + (view === 'detail' ? 'overview' : view));
    for (const h of HOLDINGS) {
      const price = quotes[h.symbol]?.price;
      $(`#value-${h.symbol}`).textContent = usd(Number.isFinite(price) ? Math.round(price * h.quantity * 100) / 100 : null);
      $(`#quote-${h.symbol}`).textContent = Number.isFinite(price) ? usd(price) + ' / coin' : 'Quote unavailable';
      $(`[data-asset="${h.symbol}"]`).setAttribute('aria-pressed', String(view === 'detail' && selected === h.symbol));
    }
    const at = Math.min(...Object.values(quotes).map(q => q.at));
    $('#wallet-source').dataset.state = state;
    $('#wallet-quote-status').textContent = state === 'live' ? 'Coinbase spot quotes / updated ' + timestamp(at) : state === 'cached' ? 'Saved Coinbase quotes / ' + timestamp(at) : state === 'partial' ? 'Partial quotes / total unavailable' : fetching ? 'Connecting to Coinbase quotes' : 'Quotes unavailable / reconnecting';
    let content;
    if (view === 'allocation') {
      const assets = [...HOLDINGS.map(h => ({ name: h.symbol, value: quotes[h.symbol] ? Math.round(quotes[h.symbol].price * h.quantity * 100) / 100 : null, color: h.color })), { name: 'USD', value: CASH, color: '#c1dc92' }];
      let offset = 0;
      const gradient = total ? assets.map(a => { const start = offset; offset += a.value / total * 100; return `${a.color} ${start.toFixed(3)}% ${offset.toFixed(3)}%`; }).join(',') : '#2a3e30 0% 100%';
      content = `<div class="wallet-eyebrow">Portfolio composition</div><div class="wallet-allocation"><div class="wallet-ring" style="background:conic-gradient(${gradient})" role="img" aria-label="Allocation of demo portfolio"></div><div class="wallet-legend">${assets.map(a => `<div><i style="background:${a.color}"></i>${a.name}<b>${total ? (a.value / total * 100).toFixed(1) + '%' : '&mdash;'}</b></div>`).join('')}</div></div><div class="wallet-cash"><span>Total portfolio value</span><strong>${usd(total)}</strong></div>`;
    } else if (view === 'activity') {
      content = `<div class="wallet-eyebrow">This desk session</div><div class="wallet-log">${activity.slice(0,5).map(a => `<div class="wallet-log-row"><i>&#8599;</i><span>${a.text}</span><time>${new Date(a.at).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}</time></div>`).join('') || '<div class="wallet-log-empty">Your portfolio visits appear here.</div>'}</div><div class="wallet-chart-note">Portfolio reviews / no orders placed</div>`;
    } else if (view === 'detail') {
      const h = HOLDINGS.find(h => h.symbol === selected);
      content = `<div class="wallet-eyebrow">${h.name} / ${h.symbol}-USD</div><div class="wallet-balance">${usd(quotes[selected]?.price)}</div>${change(selected)}${chart(selected)}<div class="wallet-detail-meta"><span>Your demo position<strong>${h.quantity} ${h.symbol}</strong></span><span>Position value<strong>${usd(quotes[selected] ? Math.round(quotes[selected].price * h.quantity * 100) / 100 : null)}</strong></span></div>`;
    } else {
      content = `<div class="wallet-eyebrow">Total portfolio value</div><div class="wallet-balance" id="wallet-total">${usd(total)}</div>${change()}${chart()}<div class="wallet-chart-note" style="margin-top:13px">Fictional holdings / market-priced valuation</div>`;
    }
    $('#wallet-panel').innerHTML = content;
    root.dataset.view = view;
  }
  async function refresh() {
    if (fetching || Date.now() - lastFetch < REFRESH_MS) return;
    fetching = true; lastFetch = Date.now(); render();
    const result = await fetchQuotes(); quotes = { ...quotes, ...result.quotes }; failed = result.failed; fetching = false; save(); render();
    const day = new Date().toISOString().slice(0, 10);
    if (!result.failed && !historyBusy && historyAttemptDay !== day) {
      historyBusy = true; render();
      const next = await fetchHistory(history);
      if (next.length === 7) historyAttemptDay = day;
      if (next.length) history = next;
      historyBusy = false; save(); render();
    }
  }
  function show(visible) {
    if (visible !== !root.hidden) {
      root.hidden = !visible;
      document.body.classList.toggle('wallet-open', visible);
      document.querySelector('#portfolio-btn').setAttribute('aria-pressed', String(visible));
      if (visible) { view = 'overview'; root.scrollTop = 0; record('Opened demo portfolio'); render(); void refresh(); }
    }
  }
  const interval = setInterval(() => { if (!root.hidden && !document.hidden) { render(); void refresh(); } }, REFRESH_MS);
  window.addEventListener('pagehide', () => clearInterval(interval), { once: true });
  render(); void refresh();
  return {
    show,
    get visible() { return !root.hidden; },
    actionTarget(slot) { return [$('#wallet-overview'), $('[data-asset="BTC"]'), $('[data-asset="ETH"]'), $('#wallet-allocation'), $('#wallet-activity'), $('#wallet-overview')][slot]; },
  };
}
