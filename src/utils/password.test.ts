import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage if absent
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

import {
  getStoredUsers,
  authenticateUser,
  updateUserPassword,
  saveCurrentSession,
  getCurrentSession,
  DEFAULT_USERS
} from './storage';

test('Password Management: Initial state has Muhammad with default password 123', () => {
  const users = getStoredUsers();
  const admin = users.find(u => u.email === 'muhammad@gymapp.com' || u.role === 'admin');
  assert.ok(admin, 'Admin must exist');
  assert.equal(admin.password, '123');

  const auth = authenticateUser('muhammad@gymapp.com', '123');
  assert.ok(auth.user, 'Authentication must succeed with valid credentials');
  assert.equal(auth.user.email, 'muhammad@gymapp.com');
});

test('Password Management: Rejects password shorter than 3 characters', () => {
  const admin = getStoredUsers().find(u => u.email === 'muhammad@gymapp.com' || u.role === 'admin')!;
  const res = updateUserPassword(admin.id, 'ab', '123', true);
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('at least 3 characters'));
});

test('Password Management: Rejects incorrect current password when verification is enabled', () => {
  const admin = getStoredUsers().find(u => u.email === 'muhammad@gymapp.com' || u.role === 'admin')!;
  const res = updateUserPassword(admin.id, 'newpass456', 'wrongpass', true);
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Current password is incorrect'));
});

test('Password Management: Rejects changing to the identical password', () => {
  const admin = getStoredUsers().find(u => u.email === 'muhammad@gymapp.com' || u.role === 'admin')!;
  const currentPass = admin.password || '123';
  const res = updateUserPassword(admin.id, currentPass, currentPass, true);
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('identical to the current password'));
});

test('Password Management: Successfully updates admin password and syncs session', () => {
  const admin = getStoredUsers().find(u => u.email === 'muhammad@gymapp.com' || u.role === 'admin')!;
  saveCurrentSession(admin);

  const res = updateUserPassword(admin.id, 'Muhammad2026!Pro', '123', true);
  assert.equal(res.success, true);
  assert.equal(res.user?.password, 'Muhammad2026!Pro');

  // Verify in stored users list
  const refreshedUsers = getStoredUsers();
  const refreshedAdmin = refreshedUsers.find(u => u.id === admin.id)!;
  assert.equal(refreshedAdmin.password, 'Muhammad2026!Pro');

  // Verify active session remains authenticated
  const currentSession = getCurrentSession();
  assert.ok(currentSession);
  assert.equal(currentSession.id, admin.id);

  // Verify login with old password fails
  const oldAuth = authenticateUser('muhammad@gymapp.com', '123');
  assert.equal(oldAuth.user, null);
  assert.ok(oldAuth.message.includes('Incorrect password'));

  // Verify login with new password succeeds
  const newAuth = authenticateUser('muhammad@gymapp.com', 'Muhammad2026!Pro');
  assert.ok(newAuth.user);
  assert.equal(newAuth.user.id, admin.id);

  // Reset back to 123 for consistency in subsequent tests
  const revertRes = updateUserPassword(admin.id, '123', 'Muhammad2026!Pro', true);
  assert.equal(revertRes.success, true);
  assert.equal(revertRes.user?.password, '123');
});
