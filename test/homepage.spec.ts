import { test, expect } from './support/fixtures';

test('the homepage loads with its main nav and every section in place', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page).toHaveTitle('The Dove');
  await expect(page.locator('h1')).toHaveText(/friendly, hospitable place/i);
  await expect(page.locator('header.site nav.links')).toBeVisible();

  for (const [href, id] of [
    ['#about', 'about'],
    ['#timetable', 'timetable'],
    ['#contact', 'contact'],
  ]) {
    await expect(page.locator(`header.site nav.links a[href="${href}"]`)).toBeVisible();
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
});

test('the brand logo in the header links back to the top of the page', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('a.brand')).toHaveAttribute('href', '#top');
});

test('the home page states the venue and the opening status', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.locator('main')).toContainText("former 'Wine Vaults' pub");
  await expect(page.locator('main')).toContainText('heart of Kington');
  await expect(page.locator('main')).toContainText('Opening at the end of October 2026.');
});

test('the draft timetable lists every weekly and monthly session', async ({ page }) => {
  await page.goto('/index.html');

  const timetable = page.locator('#timetable');
  await expect(timetable).toContainText('Draft timetable');
  await expect(timetable).toContainText('subject to change');

  for (const entry of [
    'Music @ The Dove',
    'Marches Voices',
    'Morning Coffee',
    'Toddle Time',
    'Pause Caf',
    'Soul Reader book club',
    'Mere Christianity',
  ]) {
    await expect(timetable).toContainText(entry);
  }
});
