import { test, expect } from './support/fixtures';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('every page has the safeguarding strip in the footer, linking to /safeguarding', async ({ page }) => {
  for (const path of ['/index.html', '/safeguarding.html']) {
    await page.goto(path);
    const strip = page.locator('footer.site .safeguard-strip');
    await expect(strip).toContainText("Concerned about a child or adult's safety? Call 999 in an emergency.");
    await expect(strip.getByRole('link', { name: 'Safeguarding information & contacts' })).toHaveAttribute('href', '/safeguarding');
  }
});

test('the safeguarding page lists the officers, offers the policy and the helplines', async ({ page }) => {
  await page.goto('/safeguarding.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('safeguarding, care and nurture');
  await expect(page.getByRole('link', { name: 'Christine Robinson' })).toHaveAttribute('href', 'mailto:st.marys.kington.secretary54@gmail.com');
  await expect(page.getByRole('link', { name: 'Lisa Anderson' })).toHaveAttribute('href', 'mailto:lisa.anderson@hereford.anglican.org');
  await expect(page.locator('a[href="tel:+447999028076"]')).toHaveText('07999 028076');
  await expect(page.locator('.helpline-list li')).toHaveCount(8);

  const policy = page.getByRole('link', { name: /Download our Safeguarding Policy/ });
  const href = await policy.getAttribute('href');
  expect(href).toBe('/docs/SafeGuardingAugust2026.docx');
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect((await res.body()).length).toBeGreaterThan(10000);
});

test('the officer email addresses never appear in plain text in the page source', () => {
  const html = readFileSync(join(__dirname, '..', 'public', 'safeguarding.html'), 'utf8');
  expect(html).not.toContain('st.marys.kington.secretary54@gmail.com');
  expect(html).not.toContain('lisa.anderson@hereford.anglican.org');
});

test('no contact link on the safeguarding page overflows its card', async ({ page }) => {
  await page.goto('/safeguarding.html');
  const cards = page.locator('.sg-card');
  expect(await cards.count()).toBe(3);
  for (let i = 0; i < 3; i++) {
    const box = (await cards.nth(i).boundingBox())!;
    const links = cards.nth(i).locator('a');
    for (let j = 0; j < (await links.count()); j++) {
      const l = (await links.nth(j).boundingBox())!;
      expect(l.x + l.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }
  }
});
