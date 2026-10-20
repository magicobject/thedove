import { test, expect } from './support/fixtures';

// The build number is only meant to appear on the internal changelog, not
// stamped into every page's footer -- see CLAUDE.md's "Build numbers" section.
test('the updates page lists build numbers in the expected format', async ({ page }) => {
  await page.goto('/updates.html');

  const builds = page.locator('.changelog-build');
  const count = await builds.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(builds.nth(i)).toHaveText(/^\d{4}\.\d{2}\.\d{2}\.\d{3}$/);
  }
});

test('no other page shows a build number', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.build-number, .changelog-build')).toHaveCount(0);
});
