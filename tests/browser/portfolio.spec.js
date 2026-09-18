import { test, expect } from '@playwright/test';
const prices = {BTC:70000,ETH:3000,SOL:150};
async function quotes(page) {
  await page.route('https://api.coinbase.com/**', route => { const url = new URL(route.request().url()), symbol = url.pathname.split('/')[3].split('-')[0]; const discount = url.searchParams.has('date') ? .95 : 1; return route.fulfill({json:{data:{amount:String(prices[symbol]*discount),currency:'USD',base:symbol}}}); });
  await page.route('https://s3.tradingview.com/**',route=>route.abort());
}
test('Portfolio uses market quotes, navigates details and allocation, and fits mobile', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await quotes(page);await page.goto('/market.html');await page.locator('#portfolio-btn').click();
  await expect(page.locator('#wallet-total')).toHaveText('$16,620.50');
  await expect(page.locator('#wallet-source')).toHaveAttribute('data-state','live');
  await expect(page.locator('#portfolio')).toContainText('Demo portfolio');
  await expect(page.locator('.wallet-chart svg')).toBeVisible();
  await page.locator('[data-asset="BTC"]').click();await expect(page.locator('.wallet-balance')).toHaveText('$70,000.00');
  await page.locator('#wallet-allocation').click();await expect(page.locator('.wallet-ring')).toBeVisible();
  await page.locator('#wallet-activity').click();await expect(page.locator('.wallet-log')).toContainText('Inspected Bitcoin');
  await page.locator('#wallet-overview').click();await page.setViewportSize({width:825,height:495});
  await page.screenshot({path:'test-results/portfolio-laptop.png'});
  await page.setViewportSize({width:390,height:700});await page.screenshot({path:'test-results/portfolio-mobile.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#wallet-exit').click();await expect(page.locator('#portfolio')).toBeHidden();
  expect(errors).toEqual([]);
});
test('Offline quotes retain a timestamped cached total or show unavailable without inventing money', async ({page}) => {
  await quotes(page);await page.goto('/market.html');await page.locator('#portfolio-btn').click();
  await expect(page.locator('#wallet-total')).toHaveText('$16,620.50');
  await page.route('https://api.coinbase.com/**',route=>route.abort());
  await page.reload();await page.locator('#portfolio-btn').click();
  await expect(page.locator('#wallet-source')).toHaveAttribute('data-state','cached');
  await expect(page.locator('#wallet-total')).toHaveText('$16,620.50');
  await expect(page.locator('#wallet-quote-status')).toContainText('Saved Coinbase quotes');
  await page.evaluate(()=>localStorage.removeItem('hiflyguy.portfolio.quotes.v1'));await page.reload();await page.locator('#portfolio-btn').click();
  await expect(page.locator('#wallet-source')).toHaveAttribute('data-state','unavailable');
  await expect(page.locator('#wallet-total')).toHaveText('\u2014');
});
test('Automatic portfolio sequence preserves charts, pauses in the wallet, and closes when disabled', async ({page}) => {
  test.setTimeout(110000);
  await quotes(page);await page.goto('/');await page.locator('[data-environment="computer"]').click();await page.locator('#adderall-btn').click();
  await expect(page.locator('#behavior-pill')).toHaveText('Locked in',{timeout:30000});
  const terminal=page.frameLocator('.laptop-display iframe');
  await expect(terminal.locator('#portfolio')).toBeHidden();
  await expect(terminal.locator('#portfolio')).toBeVisible({timeout:27000});
  const market=await terminal.locator('#symbol').inputValue();
  await expect(terminal.locator('#portfolio')).toHaveAttribute('data-view','detail',{timeout:5000});
  await page.locator('#pause-btn').click();await page.waitForTimeout(2500);
  await expect(terminal.locator('#portfolio')).toHaveAttribute('data-view','detail');
  await page.locator('#pause-btn').click();
  await expect(terminal.locator('#portfolio')).toHaveAttribute('data-view','allocation',{timeout:8000});
  await expect(terminal.locator('#portfolio')).toHaveAttribute('data-view','activity',{timeout:4000});
  await expect(terminal.locator('#symbol')).toHaveValue(market);
  await expect(terminal.locator('#portfolio')).toBeHidden({timeout:6000});
  await expect(terminal.locator('#portfolio')).toBeVisible({timeout:27000});
  await page.locator('#adderall-btn').click();await expect(terminal.locator('#portfolio')).toBeHidden();
});
