import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextBuildState, formatBuildNumber } from '../scripts/bump-build-number.mjs';

test("starts today's counter at 1 when there is no saved state", () => {
  const state = nextBuildState('2026.10.20', null);
  assert.deepEqual(state, { date: '2026.10.20', build: 1 });
});

test('increments the counter when the saved state is from the same day', () => {
  const state = nextBuildState('2026.10.20', { date: '2026.10.20', build: 3 });
  assert.deepEqual(state, { date: '2026.10.20', build: 4 });
});

test('resets the counter to 1 on a new day', () => {
  const state = nextBuildState('2026.10.21', { date: '2026.10.20', build: 7 });
  assert.deepEqual(state, { date: '2026.10.21', build: 1 });
});

test('formatBuildNumber pads the counter to three digits', () => {
  assert.equal(formatBuildNumber({ date: '2026.10.20', build: 1 }), '2026.10.20.001');
  assert.equal(formatBuildNumber({ date: '2026.10.20', build: 42 }), '2026.10.20.042');
});
