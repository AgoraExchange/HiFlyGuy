import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium } from '@playwright/test';
let release = 1;
const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/HiFlyGuy/')) { res.writeHead(404).end(); return; }
    const relative = url.pathname.slice('/HiFlyGuy/'.length) || 'index.html';
    const path = resolve(root, relative);
    if (!path.startsWith(root + '/') && !path.startsWith(root + '\\')) { res.writeHead(403).end(); return; }
    let data = await readFile(path);
    if (relative === 'sw.js' && release === 2) data = Buffer.from(data.toString().replace(/const CACHE = .*;/, 'const CACHE = `${CACHE_PREFIX}test-release-2`;'));
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(5193, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5193/HiFlyGuy/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#viewport > canvas');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert.equal(await page.locator('#render-error').isVisible(), false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Phone page must not overflow');
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click();
  await page.getByRole('button', { name: 'Place near FlyGuy', exact: true }).click();
  const save = await page.evaluate(() => localStorage.getItem('hiflyguy.world.v1'));
  await page.locator('#check-updates').click();
  await page.waitForFunction(() => document.querySelector('#update-status').textContent === 'You are up to date.');
  await page.screenshot({ path: 'test-results/pwa-phone.png', fullPage: true });
  release = 2;
  await Promise.all([page.waitForEvent('load'), page.locator('#check-updates').click()]);
  await page.waitForSelector('#viewport > canvas');
  const after = JSON.parse(await page.evaluate(() => localStorage.getItem('hiflyguy.world.v1')));
  const before = JSON.parse(save); delete before.savedAt; delete after.savedAt;
  assert.deepEqual(after, before, 'Update must preserve saved world');
  assert.equal(await page.locator('#object-count').textContent(), '1 object');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#viewport > canvas');
  assert.equal(await page.locator('#object-count').textContent(), '1 object');
  await page.locator('#check-updates').click();
  assert.match(await page.locator('#update-status').textContent(), /offline/);
  await context.setOffline(false);
  await page.locator('[data-environment="computer"]').click();
  await page.waitForFunction(() => !!document.querySelector('iframe[src="./market.html"]'));
  assert.equal(new URL(await page.locator('iframe[src="./market.html"]').getAttribute('src'), page.url()).pathname, '/HiFlyGuy/market.html');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#terminal-btn').click();
  const terminal = page.frameLocator('#terminal-mount iframe');
  await terminal.locator('#portfolio-btn').click();
  await terminal.locator('#portfolio:not([hidden])').waitFor();
  assert.match(await terminal.locator('#portfolio').textContent(), /ASTER WALLET/);
  assert.equal(await terminal.locator('#wallet-total').textContent(), '\u2014');
  await page.locator('#close-terminal').click();
  await page.locator('#director-btn').click();
  await page.locator('#director-actions-btn').click();
  await page.locator('#maybach-action').click();
  await page.locator('#director-cinema:not([hidden])').waitFor();
  const cinematic = page.frameLocator('iframe[title="Aster Wallet cinematic display"]');
  await cinematic.locator('#portfolio:not([hidden])').waitFor();
  assert.match(await cinematic.locator('#portfolio').textContent(), /ASTER WALLET/);
  await page.keyboard.press('Escape');
  await page.locator('#director-return').click();
  assert.deepEqual(errors, []);
  console.log('PASS: mobile render, scoped paths, no-update check, update/restart, saved world, offline reopen, offline status, market path, offline portfolio modules, offline director scene');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
