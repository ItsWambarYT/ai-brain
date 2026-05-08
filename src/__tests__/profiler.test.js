// @ts-check
/**
 * profiler.relativeAge — pure date helper, easy to pin down with fixed dates.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { relativeAge } from '../profiler.js';

function isoNDaysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

test('"today" for an iso date dated now', () => {
  assert.equal(relativeAge(new Date().toISOString()), 'today');
});

test('"yesterday" for ~1 day ago', () => {
  assert.equal(relativeAge(isoNDaysAgo(1)), 'yesterday');
});

test('reports days for sub-week ages', () => {
  assert.equal(relativeAge(isoNDaysAgo(3)), '3 days ago');
});

test('reports weeks for sub-month ages', () => {
  assert.equal(relativeAge(isoNDaysAgo(14)), '2 weeks ago');
});

test('reports months for sub-year ages', () => {
  assert.equal(relativeAge(isoNDaysAgo(120)), '4 months ago');
});

test('reports years for ages past a year', () => {
  assert.equal(relativeAge(isoNDaysAgo(800)), '2 years ago');
});
