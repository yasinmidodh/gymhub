import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareMessage, getCleanAppUrl } from './shareInstructions.ts';

test('getCleanAppUrl strips hash and query', () => {
  assert.equal(
    getCleanAppUrl('https://user.github.io/GymHub/?x=1#top'),
    'https://user.github.io/GymHub/'
  );
});

test('getCleanAppUrl returns input if it is not a valid URL', () => {
  assert.equal(getCleanAppUrl('not a url'), 'not a url');
});

test('English message contains link, iPhone and Android steps', () => {
  const msg = buildShareMessage({ appUrl: 'https://a.b/GymHub/', lang: 'en' });
  assert.ok(msg.includes('https://a.b/GymHub/'));
  assert.ok(msg.includes('Add to Home Screen'));
  assert.ok(msg.includes('Safari'));
  assert.ok(msg.includes('Android'));
  assert.ok(!msg.includes('APK file'));
});

test('APK link is included only when provided', () => {
  const withApk = buildShareMessage({ appUrl: 'https://a.b/', apkUrl: ' https://drive/apk ', lang: 'en' });
  assert.ok(withApk.includes('https://drive/apk'));
  assert.ok(withApk.includes('APK file'));
});

test('Arabic message contains link and iPhone steps', () => {
  const msg = buildShareMessage({ appUrl: 'https://a.b/GymHub/', apkUrl: 'https://drive/apk', lang: 'ar' });
  assert.ok(msg.includes('https://a.b/GymHub/'));
  assert.ok(msg.includes('Add to Home Screen'));
  assert.ok(msg.includes('Safari'));
  assert.ok(msg.includes('https://drive/apk'));
});
