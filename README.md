# The Dove

Static site for The Dove, a new community space in the former "Wine Vaults" pub in the heart of Kington, opening at the end of October 2026. Built to deploy on Cloudflare Workers (static assets), auto-deploying on push to `main` once Greg finishes setting up the Cloudflare project. Same lightweight build pipeline as [kingtonfoodbank](https://github.com/magicobject/kingtonfoodbank) and [kington-parishes](https://github.com/magicobject/kington-parishes) -- the short version is below.

## Quick start

```bash
npm install       # also wires up the pre-commit hook -- see below
npm run build     # generate public/*.html from templates/ + src/
npm run serve     # serve public/ locally at http://localhost:4175
npm test          # run the unit tests, then the Playwright suite
```

`npm run serve` is a quick local static-file server -- good for most editing, but it does **not** apply the security headers in `public/_headers`. To see the site exactly as Cloudflare will serve it (headers included), use `npx wrangler dev` instead and check the browser's network tab or console.

## What this site is, in plain English

One page (`index.html`) with three sections you can jump to from the menu:

- **About** -- what The Dove is and where it is.
- **Timetable** -- the current *draft* weekly and monthly groups (it's explicitly a draft because the real one, from a printed leaflet, is still being finalised).
- **Get in touch** -- an email link to Sally Welch, who's coordinating sign-ups.

There's also a 404 ("page not found") page, and a hidden `/updates.html` page that's just a build log (see "Build numbers and the changelog" below) -- it's not meant for visitors and isn't linked from anywhere on the site.

**There is deliberately no sign-up form.** A form needs somewhere to send its data, and this is a plain static site with no server to receive one -- a form here would look like it worked and then silently go nowhere. Instead, the "Get in touch" button opens the visitor's own email app with a message already addressed and started, which they then send normally.

## How the build works

Nothing in `public/*.html` is written by hand as a full file -- each page is assembled from four pieces by [scripts/build.mjs](scripts/build.mjs):

1. **[templates/header.html](templates/header.html)**, **[templates/footer.html](templates/footer.html)**, **[templates/page.html](templates/page.html)** -- the shared page shell (nav, footer, `<head>`) with `{{PLACEHOLDER}}` tokens. The 404 and updates pages opt out of the header (neither is a nav destination) but still get the shared footer.
2. **[src/pages/\*.html](src/pages)** -- just the content unique to each page. No `<head>`, no header, no footer -- the build script wraps that around it.
3. **[src/pages.config.mjs](src/pages.config.mjs)** -- the nav links and each page's `<title>`/meta description/robots behaviour.
4. **[src/site.config.mjs](src/site.config.mjs)** -- the single source of truth for the facts repeated across the site: the org name, strapline, venue description, contact name and email, and the opening status. Every `camelCase` key becomes an `{{UPPER_SNAKE_CASE}}` token (e.g. `openingStatus` -> `{{OPENING_STATUS}}`), substituted wherever it appears -- in the templates *and* in `src/pages/*.html` content. That's what makes this DRY: the opening status is typed once, in one file, and shows up correctly in the hero, the footer, and anywhere else it's quoted.

Running `npm run build` reads all four and writes the finished files into `public/`, which is what Cloudflare actually serves (`wrangler.jsonc` points `assets.directory` at `./public`).

## What to edit, and what never to touch

| Want to change... | Edit this | Never edit this |
|---|---|---|
| The contact name, email, venue description, strapline, opening status | `src/site.config.mjs` | Any hard-coded string in `src/pages/` or `templates/` |
| A timetable entry (add, remove, reword) | `src/pages/index.html` (and `test/homepage.spec.ts` if you add a new session, so the test keeps checking it's there) | `public/index.html` |
| Page content (wording, sections) | `src/pages/<page>.html` | `public/<page>.html` |
| Nav links, page title/description | `src/pages.config.mjs` | `public/<page>.html` |
| Header/footer, shared `<head>` | `templates/*.html` | `public/<page>.html` |
| Styling | `public/css/style.css` (this one genuinely lives in `public/` -- it isn't generated) | -- |
| Behaviour (email decoding, reveal-on-scroll) | `public/js/main.js` (also hand-maintained) | -- |

**`public/*.html` is a build artefact.** Every one of those files opens with an auto-generated `DO-NOT-EDIT` HTML comment banner for exactly this reason: a hand-edit made directly to a file in `public/` will be **silently overwritten** the next time anyone runs `npm run build` -- which happens automatically on every commit (see below).

### Adding or changing a timetable entry

1. Open `src/pages/index.html` and find the `<ul class="timetable-list">` under either "Weekly sessions" or "Monthly meetings".
2. Copy an existing `<li class="timetable-item">` block, change the day/time and the `<h4>` title and description, and keep the heading level (`<h4>`) the same so the page's heading outline stays correct for accessibility.
3. Run `npm run build` and check it locally (`npm run serve`), then run `npm test` before committing.
4. If you've added a brand-new entry (not just reworded an existing one), add it to the list in `test/homepage.spec.ts`'s "the draft timetable lists every weekly and monthly session" test so a future edit can't silently drop it.

### Adding a changelog entry

See "Build numbers and the changelog" below -- in short, add a new `<li>` at the *top* of the list in `src/pages/updates.html`, with the build number the commit is about to get, before you commit.

## The pre-commit hook and the build number in the footer

Every page's footer shows a build number like `Build 2026.10.20.001` (format `yyyy.mm.dd.NNN`, where `NNN` counts commits made that day, stored in [build-number.json](build-number.json)).

This is maintained automatically, not by hand. `npm install` runs the `prepare` script, which points git at the tracked [.githooks/pre-commit](.githooks/pre-commit) hook. On every commit, that hook:

1. Runs [scripts/bump-build-number.mjs](scripts/bump-build-number.mjs), which increments today's counter in `build-number.json`.
2. Runs `npm run build`, regenerating every file in `public/` -- including stamping the new build number into each footer and cache-busting `css/style.css?v=...` and `js/main.js?v=...`.
3. Stages the results (`git add public build-number.json`) so they're included in the commit you're about to make.

In other words: **you never bump the build number or rebuild `public/` yourself** -- just edit source files under `src/`/`templates/` and commit as normal.

## Build tags and the /updates changelog

Every commit gets a matching git tag, `build-<date>.<NNN>` (e.g. `build-2026.10.20.001`) -- the same value as the footer's "Build ..." text for that commit, so any deployed build is checkoutable by name (`git checkout build-2026.10.20.001`) without digging through `git log`.

[src/pages/updates.html](src/pages/updates.html) (served at `/updates.html`) is a hand-maintained changelog, one entry per build number, newest first -- the human-readable counterpart to the git tags. It's a real page, built by the normal pipeline like any other, but it's deliberately not linked from anywhere on the site, and is `robots: noindex`.

## Accessibility

Every page is scanned with [axe-core](https://github.com/dequelabs/axe-core) (via `@axe-core/playwright`) in [test/accessibility.spec.ts](test/accessibility.spec.ts) -- part of `npm test`, so a real regression fails the suite, not just a one-off manual check.

The reveal-on-scroll animation (`.reveal` / the inline scroll script) means elements below the fold are still at `opacity: 0` -- or mid-transition -- when a scan runs immediately after `page.goto()`. Axe reads that as a real colour-contrast failure, which it isn't. The spec force-settles every `.reveal` element before scanning, so it tests the real final state a visitor actually sees.

## Email obfuscation and the "Get in touch" button

Spam harvesters read page source, not the rendered page, so the real email address (`vicar@kingtonparishes.org.uk`) never appears in plain text anywhere in `public/`. [scripts/obfuscate-email.mjs](scripts/obfuscate-email.mjs) has two helpers:

- `emailLinkHtml(address)` -- a plain display of the address (used in the footer). Before JavaScript runs, visitors see "vicar [at] kingtonparishes.org.uk" as plain text; `public/js/main.js` decodes it into a working `mailto:` link on page load.
- `emailButtonHtml(address, label, { subject, body })` -- the "Email Sally Welch" call-to-action in the "Get in touch" section. Same idea, but it also carries a pre-filled subject and body (not the address itself, so they don't need obfuscating), which `public/js/main.js` turns into the link's query string only after it has decoded the address.

Either way, nothing is ever submitted anywhere by this site -- the visitor's own email app sends the message.

## Tests

[Playwright](https://playwright.dev) specs in `test/` cover:

- **[homepage.spec.ts](test/homepage.spec.ts)** -- the home page loads with its nav and all three sections, states the venue and opening status, and lists every timetable entry.
- **[contact-details.spec.ts](test/contact-details.spec.ts)** -- no leftover `{{TOKEN}}` placeholders and no plain email address ever reaches the page source; the "Get in touch" button resolves to a working, pre-filled `mailto:` link once JavaScript runs, and degrades to readable text without it.
- **[footer.spec.ts](test/footer.spec.ts)** -- every page shows a correctly-formatted build number and the "Site by mediawright.uk" credit.
- **[not-found.spec.ts](test/not-found.spec.ts)** -- unknown URLs get a real 404 status and the branded 404 page, which is `noindex`, has no main nav, and still shows a working contact link.
- **[accessibility.spec.ts](test/accessibility.spec.ts)** -- an axe-core scan of every page with zero tolerated violations.

`test/support/pages.ts` is the shared list of generated pages used across specs; add an entry there when adding a new page. `test-unit/` has plain `node:test` unit tests for the pure logic in `scripts/obfuscate-email.mjs`, `scripts/bump-build-number.mjs` and `scripts/vuln-watch-lib.mjs`, plus guards on the GitHub Actions workflows themselves.

## Daily vulnerability watch

The site is built with shared software packages written by other people. Sometimes a security problem is found in one of them and a public warning (an "advisory") is published. [.github/workflows/vuln-watch.yml](.github/workflows/vuln-watch.yml) checks for that every morning (06:17 UTC), and can be run on demand from GitHub's Actions tab ("Vulnerability watch" -> "Run workflow").

- It lists every installed package from `package-lock.json` and checks them against the GitHub Advisory Database (`npm audit`) and [OSV](https://osv.dev) (which also reports malicious packages).
- **Nothing found:** nothing happens; the day's result is still recorded on the run's summary page.
- **Something found:** one issue per advisory, labelled `security-advisory` (reopened if a closed advisory comes back). Fix it the normal way -- update the package, run `npm test` and `npm run audit`, open a PR.
- **High or critical:** the run itself fails, so GitHub emails the owner.
- It never changes code or dependencies itself. [.github/dependabot.yml](.github/dependabot.yml) proposes updates (npm packages and the workflow's pinned actions) as PRs, which still go through review.

The decisions live in [scripts/vuln-watch-lib.mjs](scripts/vuln-watch-lib.mjs) (unit-tested in `test-unit/`); [scripts/vuln-watch.mjs](scripts/vuln-watch.mjs) does the I/O. Try it locally with `node scripts/vuln-watch.mjs --dry-run` (no issues opened).

`npm test` runs the unit tests (`npm run test:unit`) before the Playwright suite. `test-unit/workflows.test.mjs` also guards the workflow itself: actions pinned to full commit SHAs, explicit least-privilege permissions, `npm ci --ignore-scripts`.

## The brand mark

The leaflet shows a stained-glass dove roundel, but that specific artwork isn't ours to reproduce from a photo. The header logo and the 404 page's icon are instead a simple, original line-art dove silhouette (inline SVG, in `templates/header.html` and `src/pages/404.html`) -- a placeholder Greg can swap for the real commissioned artwork if the church has a vector original. The favicon (`public/favicon.svg`) uses the same shape.

## Deployment

Push to `main` -- once Greg has set up the Cloudflare Workers/Pages project and DNS for `thedove.uk`, Cloudflare will pick up the change and deploy `public/` automatically. There's no separate deploy step to run locally, and this repo doesn't touch Cloudflare, DNS, or run `wrangler deploy` itself.
