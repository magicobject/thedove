#!/usr/bin/env node
// Assembles public/*.html from templates/ + src/pages/*.html +
// src/pages.config.mjs + src/site.config.mjs. Run `npm run build` after
// editing anything in templates/ or src/, and commit the regenerated
// public/*.html -- Cloudflare serves that directory as-is.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NAV, PAGES } from '../src/pages.config.mjs';
import { SITE } from '../src/site.config.mjs';
import { emailLinkHtml } from './obfuscate-email.mjs';

const SITE_ORIGIN = 'https://thedove.uk';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const pageTemplate = read('templates/page.html');
const headerTemplate = read('templates/header.html').trimEnd();
const footerTemplate = read('templates/footer.html').trimEnd();

// Cache-busting for hand-maintained static assets uses a hash of the asset's
// own content, not the shared build number -- the build number only
// identifies a commit on /updates.html. A content hash only changes the
// pages/assets that actually changed, instead of stamping every page and
// query string on every commit (which used to turn even a one-line fix into
// a diff touching every generated file).
const ASSET_FILES = {
  CSS_HASH: 'css/style.css',
  JS_HASH: 'js/main.js',
  DOVE_MARK_28_HASH: 'images/dove-mark-28.png',
  DOVE_MARK_72_HASH: 'images/dove-mark-72.png',
  DOVE_LOGO_HASH: 'images/dove-logo.png',
};

function assetHashTokens() {
  const tokens = {};
  for (const [token, relPath] of Object.entries(ASSET_FILES)) {
    const buf = readFileSync(join(root, 'public', relPath));
    tokens[token] = createHash('sha256').update(buf).digest('hex').slice(0, 10);
  }
  return tokens;
}

// camelCase site.config.mjs keys become {{UPPER_SNAKE_CASE}} tokens, e.g.
// mediawrightLabel -> {{MEDIAWRIGHT_LABEL}}. Every token is replaced
// everywhere it appears -- in templates and in page content alike -- so
// contact details and facts only ever need to be typed once.
function tokensFromSite(site) {
  const tokens = {};
  for (const [key, value] of Object.entries(site)) {
    const token = key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase();
    // Email addresses never become plain tokens: {{EMAIL}} would put the
    // address in the page source. Use {{EMAIL_LINK}} (obfuscated) instead.
    if (/email$/i.test(key)) tokens[`${token}_LINK`] = emailLinkHtml(value);
    else tokens[token] = value;
  }
  return tokens;
}

function replaceTokens(html, tokens) {
  let out = html;
  for (const [token, value] of Object.entries(tokens)) {
    out = out.replaceAll(`{{${token}}}`, value);
  }
  return out;
}

// In-page anchors only work on the home page; on any other page they must
// point back at it ("/#about"), and so must the brand link.
const pageHref = (href, slug) => (href.startsWith('#') && slug !== 'index' ? `/${href}` : href);

function renderNavItems(links, slug) {
  return links.map(({ href, label }) => `      <a href="${pageHref(href, slug)}">${label}</a>`).join('\n');
}

const tokens = { ...tokensFromSite(SITE), ...assetHashTokens() };

const renderHeader = (slug) => headerTemplate
  .replace('{{NAV_ITEMS}}', renderNavItems(NAV, slug))
  .replace('href="#top"', `href="${pageHref('#top', slug)}"`);

for (const page of PAGES) {
  const content = read(`src/pages/${page.slug}.html`).trimEnd();

  let extraHead = '';
  if (page.robots) extraHead += `<meta name="robots" content="${page.robots}">\n`;
  if (page.canonical !== false) {
    // Cloudflare serves the clean URL (and 307-redirects the .html form to
    // it), so the canonical must name the clean URL too, not a URL that
    // immediately redirects elsewhere.
    const cleanPath = page.slug === 'index' ? '/' : `/${page.slug}`;
    extraHead += `<link rel="canonical" href="${SITE_ORIGIN}${cleanPath}">\n`;
  }

  let html = pageTemplate
    .replace('{{TITLE}}', page.title)
    .replace('{{DESCRIPTION}}', page.description)
    .replace('{{EXTRA_HEAD}}', extraHead)
    .replace('{{HEADER}}', page.header ? renderHeader(page.slug) : '')
    .replace('{{CONTENT}}', content)
    .replace('{{FOOTER}}', footerTemplate);

  html = replaceTokens(html, tokens);

  writeFileSync(join(root, 'public', `${page.slug}.html`), html);
  console.log(`built public/${page.slug}.html`);
}
