import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthService } from '../dist/services/authService.js';

test('AuthService hashes and verifies passwords deterministically', () => {
  const password = 'password123';
  const hashed = AuthService.hashPassword(password);

  assert.equal(hashed, AuthService.hashPassword(password));
  assert.equal(AuthService.verifyPassword(password, hashed), true);
  assert.equal(AuthService.verifyPassword('wrong-password', hashed), false);
});

test('AuthService generates verifiable tokens', () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'unit-test-secret';

  try {
    const payload = {
      userId: 'user-1',
      email: 'auth@example.com',
      role: 'worker',
    };

    const token = AuthService.generateToken(payload);
    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3);

    const decoded = AuthService.verifyToken(token);
    assert.deepEqual(decoded, payload);
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }
});

test('AuthService rejects malformed and tampered tokens', () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'unit-test-secret';

  try {
    const token = AuthService.generateToken({
      userId: 'user-1',
      email: 'auth@example.com',
      role: 'worker',
    });

    const [header, payload] = token.split('.');
    const tamperedToken = `${header}.${payload}.different-signature`;

    assert.equal(AuthService.verifyToken('not-a-jwt'), null);
    assert.equal(AuthService.verifyToken(tamperedToken), null);
    assert.equal(AuthService.verifyToken(`${header}.not-json.${token.split('.')[2]}`), null);
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }
});