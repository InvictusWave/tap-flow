import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node's native TypeScript loader requires the file extension.
import { createSessionToken, verifySessionToken } from './session.ts';
// @ts-expect-error Node's native TypeScript loader requires the file extension.
import { isAdminExpired } from './admin-access.ts';

process.env.ADMIN_SESSION_SECRET = 'test-session-secret';

test('signs sessions and rejects tampered or expired values', async () => {
  const token = await createSessionToken({
    userId: 'admin-1',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 60,
  });

  assert.equal((await verifySessionToken(token))?.userId, 'admin-1');
  assert.equal(await verifySessionToken(`${token}x`), null);
  assert.equal(
    await verifySessionToken(await createSessionToken({ userId: 'admin-1', role: 'admin', exp: 1 })),
    null
  );
});

test('treats only elapsed account limits as expired', () => {
  assert.equal(isAdminExpired(null, 100), false);
  assert.equal(isAdminExpired(101, 100), false);
  assert.equal(isAdminExpired(100, 100), true);
});
