import { test, expect } from './support/fixtures';
import { PAGES } from './support/pages';

for (const { path } of PAGES) {
  test(`${path} credits mediawright.uk in the footer`, async ({ page }) => {
    await page.goto(path);

    const credit = page.locator('footer.site .fine a[href="https://mediawright.uk"]');
    await expect(credit).toBeVisible();
    await expect(credit).toHaveText('mediawright.uk');
  });
}
