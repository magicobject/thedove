# Standing instructions for this repo

These apply to every change here, not just when explicitly asked for.

## Before any push to origin
- Run `npm test` (unit tests, then the Playwright suite) and `npm audit --audit-level=high` (or `npm run audit`, same thing). Fix real findings -- don't suppress, downgrade, or skip them to get a push out.
- If the change touches page content, structure, or CSS, make sure `test/accessibility.spec.ts` is included in that run and still passes with zero violations.
- Whenever the whole suite (`npm test`) is run, report the number of tests run and the time taken, prefixed with this repo's name (e.g. "TheDove: 56 tests passed in 6.6s") -- the count and duration are in Playwright's own summary line plus the unit-test runner's, the name prefix makes it scannable when work spans multiple sites in one session.

## Accessibility
- Every page must pass an axe-core scan (`@axe-core/playwright`, via `test/accessibility.spec.ts`) with zero violations. New pages need an entry in `test/support/pages.ts` -- the accessibility spec picks them up automatically from there.
- This site uses a reveal-on-scroll animation (`.reveal` / `.in`). A scan run right after `page.goto()` will false-positive on below-the-fold elements still at `opacity:0`. If you touch the accessibility spec, keep the settle step that force-adds `.in` and kills the transition/opacity/transform inline before scanning -- toggling the class alone isn't enough.
- Any new heading needs to fit the existing outline (no skipped levels -- h1 -> h2 -> h3 -> h4, not h1 -> h3). On the home page: hero h1, section heads h2, timetable group subheadings h3, individual timetable entries h4.
- Any new text/background colour pairing must clear WCAG AA contrast (4.5:1 for normal text, 3:1 for large text/UI components) -- compute it (relative luminance), don't eyeball it, and note the computed ratio in the CSS comment at the top of `public/css/style.css` next to the palette it documents. `--gold` is decorative only (underlines, dots, badge borders) -- it is NOT an approved text colour on the light backgrounds (`--bg`/`--bg-alt`/`--card`); it only clears AA against the dark footer background.
- Every `<iframe>` needs a `title`; `aria-label` only belongs on elements with an ARIA role, never a bare `<div>`. (There is currently no iframe on the site -- no address was given for The Dove, so there's no map to embed. See "Data and content" below before adding one.)

## Security
- Keep `npm audit --audit-level=high` clean before any push.
- Don't add third-party scripts, trackers, or embeds (iframes included) without adding exactly what they need to `public/_headers`' CSP first, then verifying with `npx wrangler dev` and the browser console -- `npm run serve` doesn't apply `_headers`/`_redirects`. (Note: if you run `wrangler dev` from inside an AI agent session, Wrangler appears to substitute its own locked-down CSP for local responses rather than serving the one in `_headers` -- verify the real policy by running `wrangler dev` directly in a human terminal, or by checking the production response after deploy.)
- There is deliberately no `<form>` anywhere on this site. The only way to contact The Dove is the obfuscated `mailto:` link built by `scripts/obfuscate-email.mjs` / `public/js/main.js` -- a form with nowhere to submit to would silently fail and invite visitors to type personal data into a dead end.
- Never a plain email address in page source -- it must go through `emailLinkHtml()` (plain display) or `emailButtonHtml()` (a labelled call-to-action with a pre-filled subject/body) from `scripts/obfuscate-email.mjs`, decoded client-side by `public/js/main.js`. Both keep the address out of the HTML entirely; only the reversed+base64 form appears in `public/*.html`.

## Build pipeline
- `public/*.html` is generated from `templates/*.html` + `src/pages/*.html` + `src/pages.config.mjs` + `src/site.config.mjs` by `scripts/build.mjs` -- never hand-edit it, edit the source and run `npm run build`.
- `public/css/style.css` and `public/js/main.js` are the two things in `public/` that are hand-maintained, not generated.
- The pre-commit hook bumps the build number and regenerates `public/` automatically on every commit -- never do either by hand.
- Contact details (the contact name and email address) and every other repeated fact (the venue description, the opening status, the mediawright.uk credit) live only in `src/site.config.mjs` -- never hardcode them elsewhere. If a fact isn't in `src/site.config.mjs` yet and you need it in more than one place, add it there first.
- There is no "documents" page on this site (unlike kingtonfoodbank) -- there are no PDFs to offer. If one is ever needed, follow kingtonfoodbank's `documents.html` pattern (a page entry in `src/pages.config.mjs` with `header: true`, linked from `NAV`).
- `.github/workflows/vuln-watch.yml` runs a daily dependency-vulnerability scan (GitHub Advisory Database + OSV) and opens a `security-advisory` issue for anything found -- see the "Daily vulnerability watch" section of `README.md`. It never changes code itself; `.github/dependabot.yml` proposes the actual update PRs.

## Build numbers: tag every commit, and log it on /updates.html
The pre-commit hook bumps `build-number.json` on every commit (same date -> counter +1; new date -> counter resets to 1). Two more things go with that, both driven by the *same* build number:
1. **Before committing**, work out what the new build number will be (read `build-number.json`, apply the same same-date/new-date rule above) and add a new entry at the *top* of the changelog in `src/pages/updates.html` -- that build number, today's date, the author (resolve with `gh api user --jq .login`, look it up in `users.json` -- the roster of `firstName`, `lastName`, `github` -- and use `firstName lastName` as the `changelog-author`; if the account isn't listed, add it first), and a one-line summary of the change. Newest entry first. Include this file in the commit like any other source change.
2. **After committing**, tag it with that same build number and push the tag: `git tag build-<date>.<NNN>` (e.g. `build-2026.10.20.001`, matching the footer's "Build 2026.10.20.001" text exactly), then `git push origin build-<date>.<NNN>`.

`/updates.html` is a real, reachable page -- it's just not linked from anywhere on the site (there's no multi-page nav here, only in-page anchors), and is marked `robots: noindex` in `src/pages.config.mjs`. It's a build log for whoever knows the URL, not user-facing content.

## Data and content
- Every fact on this site comes from the printed leaflet Greg provided when this site was first built. No street address or postcode was given for The Dove -- don't invent one, and don't add a map embed until a real address exists to point it at.
- The weekly/monthly timetable in `src/pages/index.html` is explicitly a *draft* ("Draft timetable -- subject to change") -- keep that framing until Greg confirms it's final.
- One source of truth per fact: the contact name, email address, venue description, strapline and opening status all live in `src/site.config.mjs`. Don't hardcode a second copy of any of them in `src/pages/*.html` or `templates/*.html`.
