import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
await mkdir('public/icons', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
for (const [size, name] of [[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#dce99f"/><g transform="translate(22 20) scale(2.3)" fill="none" stroke="#283221" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v10m0-9C5-2-3 9 10 12m2-2c7-12 15-1 2 2M9 16l-4 4m10-4 4 4M9 13l-6 1m12-1 6 1M10 6 8 3m6 3 2-3"/><ellipse cx="12" cy="14" rx="3" ry="5"/></g></svg>`);
  await page.screenshot({ path: `public/icons/${name}.png` });
}
await browser.close();
