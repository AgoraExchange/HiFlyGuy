import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5180', viewport: { width: 1440, height: 1100 }, launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-webgl', '--ignore-gpu-blocklist'] } },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5180', reuseExistingServer: true, timeout: 30000 },
});
