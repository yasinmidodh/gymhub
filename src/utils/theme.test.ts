import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb, ACCENT_PRESETS } from './theme';

test('hexToRgb correctly extracts rgb triplet', () => {
  assert.equal(hexToRgb('#00E5FF'), '0, 229, 255');
  assert.equal(hexToRgb('#10B981'), '16, 185, 129');
  assert.equal(hexToRgb('#EF4444'), '239, 68, 68');
  assert.equal(hexToRgb('invalid'), '0, 229, 255');
});

test('ACCENT_PRESETS contains vibrant athletic palette presets', () => {
  assert.ok(ACCENT_PRESETS.length >= 6);
  const ids = ACCENT_PRESETS.map(p => p.id);
  assert.ok(ids.includes('cyan'));
  assert.ok(ids.includes('emerald'));
  assert.ok(ids.includes('purple'));
});
