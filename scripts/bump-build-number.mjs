#!/usr/bin/env node
// Increments build-number.json's per-day counter. Run once per commit (from
// the pre-commit hook) -- NOT from `npm run build`, which only reads the
// current value. Format: yyyy.mm.dd.xxx, xxx = build count for that day.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Pure logic, exported so test-unit/bump-build-number.test.mjs can check the
// same-day/new-day rules without touching any file on disk: given today's
// date (yyyy.mm.dd) and the previously saved state (or null if there's
// none yet), return the next state.
export function nextBuildState(date, saved) {
  const state = saved && saved.date === date ? { ...saved } : { date, build: 0 };
  state.build += 1;
  return state;
}

export function formatBuildNumber(state) {
  return `${state.date}.${String(state.build).padStart(3, '0')}`;
}

function todayDate() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('.');
}

// Only run the file-writing side when executed directly
// (`node scripts/bump-build-number.mjs`), not when imported for its pure
// functions by the unit tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const file = join(root, 'build-number.json');
  const date = todayDate();
  const saved = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const state = nextBuildState(date, saved);
  writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
  console.log(`Build number: ${formatBuildNumber(state)}`);
}
