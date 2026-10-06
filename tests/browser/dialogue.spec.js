import { test, expect } from './member-fixture.js';

async function cue(page, direct = false) {
  await page.evaluate(async direct => {
    const { FlyDialogue } = await import('/src/dialogue.js');
    const original = FlyDialogue.prototype.update;
    FlyDialogue.prototype.update = function(dt, sim, options) {
      if (options.running && (!direct || options.canAddress)) {
        this.current = null; this.next = 0; this.lastContext = sim.environment;
        this.nextViewer = direct ? 0 : Infinity;
        FlyDialogue.prototype.update = original;
      }
      return original.call(this, dt, sim, options);
    };
  }, direct);
}

test('speech is logged, persisted and exported, with pause and bubble controls', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.work-life-panel small')).toHaveText('Virtual World Money. An 8 hour shift takes 2 minutes of real time.');
  await cue(page);
  await expect(page.locator('.dialogue-entry').first()).toBeVisible();
  await expect(page.locator('.dialogue-entry time').first()).toHaveAttribute('datetime', /T/);
  await page.locator('#pause-btn').click();
  const texts = await page.locator('.dialogue-entry p').allTextContents();
  await page.waitForTimeout(400); await expect(page.locator('.dialogue-entry')).toHaveCount(texts.length);
  await page.locator('#speech-enabled').uncheck(); await expect(page.locator('#fly-speech')).toBeHidden();
  const downloadEvent = page.waitForEvent('download'); await page.locator('#download-dialogue').click();
  expect((await downloadEvent).suggestedFilename()).toBe('flyguy-little-moments.txt');
  await page.reload(); await expect(page.locator('.dialogue-entry p')).toHaveText(texts);
  await expect(page.locator('#speech-enabled')).not.toBeChecked(); expect(errors).toEqual([]);
});

test('a camera visit approaches, addresses the viewer and returns to the world', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await cue(page, true);
  await expect(page.locator('#viewport')).toHaveClass(/fly-addressing/);
  await expect(page.locator('#fly-speech.to-viewer')).toBeVisible({ timeout: 12000 });
  await expect(page.locator('.dialogue-entry.addressed')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/dialogue-camera-visit.png' });
  await expect(page.locator('#viewport')).not.toHaveClass(/fly-addressing/, { timeout: 20000 });
  await expect(page.locator('#end-encounter')).toBeHidden();
  await cue(page, true); await expect(page.locator('#end-encounter')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#end-encounter')).toBeVisible();
  await expect(page.locator('#end-encounter')).toBeDisabled();
  await expect(page.locator('#end-encounter')).toBeHidden({timeout:20000});
  expect(errors).toEqual([]);
});

test('mobile dialogue fits the viewport with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await cue(page, true);
  await expect(page.locator('#fly-speech.to-viewer')).toBeVisible({ timeout: 12000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.locator('#fly-speech').boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/dialogue-mobile.png', fullPage: true });
  await page.locator('#viewport > canvas').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:42,button:0});
  await expect(page.locator('#fly-speech')).toBeVisible();
  await expect(page.locator('#end-encounter')).toBeHidden({timeout:20000});
});
