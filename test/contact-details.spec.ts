import { test, expect } from './support/fixtures';
import { PAGES } from './support/pages';

// Regression guard for the email obfuscation: the real address never
// appears in the page source, and there is no form to submit -- just a
// mailto: link built client-side once main.js has decoded the address.
for (const { path } of PAGES) {
  test(`${path} has no leftover {{TOKEN}} placeholders`, async ({ page }) => {
    await page.goto(path);
    const html = await page.content();
    expect(html).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  test(`${path} has no plain email address in its source`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    expect(html).not.toMatch(/[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[A-Za-z]/);
    expect(html).not.toContain('mailto:');
  });
}

test('the "Get in touch" button resolves to a pre-filled mailto link for Sally Welch', async ({ page }) => {
  await page.goto('/index.html');

  const cta = page.locator('#contact a[href^="mailto:vicar@kingtonparishes.org.uk"]');
  await expect(cta).toBeVisible();
  await expect(cta).toHaveText('Email Sally Welch');

  const href = await cta.getAttribute('href');
  expect(href).toContain('subject=');
  expect(href).toContain('body=');
});

test('the footer shows a plain, working mailto link for the same address', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('footer.site a[href="mailto:vicar@kingtonparishes.org.uk"]')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the email address shows as readable "name [at] domain" text, with no working link', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('footer.site')).toContainText('vicar [at] kingtonparishes.org.uk');
    await expect(page.locator('#contact')).toContainText('vicar [at] kingtonparishes.org.uk');
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });
});
