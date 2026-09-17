import { test, expect } from '@playwright/test';

test('Night desk preserves the world, supports watching, and survives unavailable market data', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('https://s3.tradingview.com/**', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click();
  await page.getByRole('button', { name: /Place near FlyGuy|Place in this room/ }).click();
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await page.waitForTimeout(200);
  const coordinates = await page.locator('#coordinates').textContent();
  await page.getByRole('button', { name: '03 Night desk', exact: true }).click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'computer');
  await expect(page.locator('#object-count')).toHaveText('0 objects');
  await expect(page.locator('#coordinates')).toHaveText(coordinates);
  const terminal = page.frameLocator('iframe[title="FlyGuy market terminal — TradingView"]');
  await expect(terminal.locator('#status-title')).toHaveText('Market feed unavailable');
  await page.screenshot({ path: 'test-results/night-desk.png', fullPage: true });
  await page.getByRole('button', { name: 'Open terminal', exact: true }).click();
  await expect(page.locator('#terminal-dialog')).toBeVisible();
  await terminal.getByLabel('Market symbol').selectOption('NASDAQ:AAPL');
  await expect(terminal.locator('#credit-link')).toHaveAttribute('href', 'https://www.tradingview.com/symbols/NASDAQ-AAPL/');
  await expect(terminal.locator('#status-title')).toHaveText('Market feed unavailable');
  await page.screenshot({ path: 'test-results/night-terminal.png' });
  await page.getByRole('button', { name: 'Close market terminal' }).click();
  await expect(page.locator('#terminal-dialog')).toBeHidden();
  await page.reload();
  await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'computer');
  await expect(page.locator('#object-count')).toHaveText('0 objects');
  await expect(page.getByRole('button', { name: 'Resume simulation', exact: true })).toBeVisible();
  await page.locator('#invite-fly').click();
  await page.getByRole('button', { name: 'Resume simulation', exact: true }).click();
  await expect(page.locator('#behavior-pill')).toHaveText('Watching screen', { timeout: 25000 });
  await page.screenshot({ path: 'test-results/night-desk-watching.png', fullPage: true });
  await page.getByRole('button', { name: 'Watching enabled', exact: true }).click();
  await expect(page.locator('#behavior-pill')).not.toHaveText('Watching screen');
  await page.getByRole('button', { name: '01 Habitat', exact: true }).click();
  await expect(page.locator('.computer-display-layer')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Night desk and market terminal work in phone fullscreen', async ({ page }) => {
  await page.route('https://s3.tradingview.com/**', route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('button', { name: '03 Night desk', exact: true }).click();
  await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  await expect(page.locator('#inventory')).toBeVisible();
  await page.screenshot({ path: 'test-results/night-desk-mobile.png' });
  await page.getByRole('button', { name: 'Open terminal', exact: true }).click();
  const panel = await page.locator('#terminal-dialog').boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x + panel.width).toBeLessThanOrEqual(390);
  const terminal = page.frameLocator('#terminal-mount iframe');
  await expect(terminal.locator('#status-title')).toHaveText('Market feed unavailable');
  await page.screenshot({ path: 'test-results/night-terminal-mobile.png' });
  await terminal.getByLabel('Market symbol').focus(); await page.keyboard.press('Escape');
  await expect(page.locator('#terminal-dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Inventory: fresh tomato' }).click();
  await page.getByRole('button', { name: /Place near FlyGuy|Place in this room/ }).click();
  await expect(page.locator('#object-count')).toHaveText('1 object');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('Official TradingView embed config loads the selected symbol (mocked provider)', async ({ page }) => {
  await page.route('https://s3.tradingview.com/**', route => route.fulfill({ contentType: 'text/javascript', body: `(()=>{const s=document.currentScript; const config=JSON.parse(s.textContent); const f=document.createElement('iframe'); f.srcdoc='<body>Provider fixture: '+config.symbol+'</body>'; s.parentElement.querySelector('.tradingview-widget-container__widget').append(f);})();` }));
  await page.goto('/market.html');
  await expect(page.locator('#feed-status')).toBeHidden();
  await expect(page.frameLocator('#chart-host iframe').locator('body')).toHaveText('Provider fixture: BITSTAMP:BTCUSD');
  await page.getByLabel('Market symbol').selectOption('NASDAQ:NVDA');
  await expect(page.frameLocator('#chart-host iframe').locator('body')).toHaveText('Provider fixture: NASDAQ:NVDA');
  await page.getByLabel('Market symbol').selectOption('KRAKEN:XMRUSD');
  await expect(page.frameLocator('#chart-host iframe').locator('body')).toHaveText('Provider fixture: KRAKEN:XMRUSD');
  await expect(page.locator('#feed-label')).toContainText('delays vary');
});

for (const mobile of [false, true]) test(`Laptop market selector works directly in the 3D world (${mobile ? 'touch fullscreen' : 'mouse'})`, async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('https://s3.tradingview.com/**', route => route.abort());
  if (mobile) await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/'); await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await page.getByRole('button', { name: '03 Night desk', exact: true }).click();
  if (mobile) await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  const terminal = page.frameLocator('.laptop-display iframe');
  await expect(terminal.locator('#scene-market-button')).toHaveText('BTC / USD');
  const clickInWorld = async locator => {
    const box = await locator.boundingBox(), x = box.x + box.width / 2, y = box.y + box.height / 2;
    // Real input goes to the WebGL canvas, which must raycast the screen and
    // deliver the correct local coordinates to its embedded UI.
    if (mobile) { const client = await page.context().newCDPSession(page); await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await client.detach(); }
    else await page.mouse.click(x, y);
  };
  for (const [name, value] of [['ETH / USD', 'COINBASE:ETHUSD'], ['XMR / USD', 'KRAKEN:XMRUSD']]) {
    await clickInWorld(terminal.locator('#scene-market-button'));
    await expect(terminal.locator('#scene-market-button')).toHaveAttribute('aria-expanded', 'true');
    await clickInWorld(terminal.getByRole('option', { name, exact: true }));
    await expect(terminal.locator('#scene-market-button')).toHaveText(name);
    await expect(terminal.locator('#symbol')).toHaveValue(value);
    await expect(terminal.locator('#scene-market-menu')).toBeHidden();
  }
  await expect(page.locator('#terminal-dialog')).toBeHidden();
  await expect(page.locator('#object-count')).toHaveText('0 objects');
  await page.screenshot({ path: `test-results/market-selector-${mobile ? 'touch' : 'mouse'}.png` });
  await page.getByRole('button', { name: 'Open terminal', exact: true }).click();
  const expanded = page.frameLocator('#terminal-mount iframe');
  await expect(expanded.getByLabel('Market symbol')).toHaveValue('KRAKEN:XMRUSD');
  await expanded.getByLabel('Market symbol').selectOption('BITSTAMP:BTCUSD');
  await page.getByRole('button', { name: 'Close market terminal' }).click();
  await expect(terminal.locator('#scene-market-button')).toHaveText('BTC / USD');
  expect(errors).toEqual([]);
});
