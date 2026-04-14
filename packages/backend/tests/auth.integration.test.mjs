import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestServer, loginUser, requestJson, signupUser } from './helpers/apiTestUtils.mjs';

test('auth rejects invalid signup and login requests', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-auth-validation-');

  const signupMissingFields = await requestJson(baseUrl, 'POST', '/api/auth/signup', {
    expectedStatus: 400,
    body: { email: '', password: '', name: '' },
  });
  assert.equal(signupMissingFields.error.code, 'INVALID_REQUEST');

  const signup = await signupUser(baseUrl, { email: 'duplicate@example.com', name: 'Duplicate User' });
  assert.equal(signup.payload.data.user.email, 'duplicate@example.com');

  const duplicateSignup = await signupUser(baseUrl, {
    email: 'duplicate@example.com',
    expectedStatus: 409,
  });
  assert.equal(duplicateSignup.payload.error.code, 'USER_EXISTS');

  const loginMissingFields = await requestJson(baseUrl, 'POST', '/api/auth/login', {
    expectedStatus: 400,
    body: { email: '', password: '' },
  });
  assert.equal(loginMissingFields.error.code, 'INVALID_REQUEST');

  const invalidLogin = await loginUser(baseUrl, {
    email: 'duplicate@example.com',
    password: 'wrong-password',
    expectedStatus: 401,
  });
  assert.equal(invalidLogin.error.code, 'INVALID_CREDENTIALS');
});

test('auth refreshes tokens and logout returns success', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-auth-refresh-');

  const missingRefreshToken = await requestJson(baseUrl, 'POST', '/api/auth/refresh', {
    expectedStatus: 401,
  });
  assert.equal(missingRefreshToken.error.code, 'TOKEN_ERROR');

  const invalidRefreshToken = await requestJson(baseUrl, 'POST', '/api/auth/refresh', {
    expectedStatus: 401,
    token: 'not-a-valid-token',
  });
  assert.equal(invalidRefreshToken.error.code, 'TOKEN_ERROR');

  const signup = await signupUser(baseUrl, { name: 'Refresh User' });
  const login = await loginUser(baseUrl, {
    email: signup.email,
    password: signup.password,
  });

  const refreshed = await requestJson(baseUrl, 'POST', '/api/auth/refresh', {
    expectedStatus: 200,
    token: login.data.token,
  });
  assert.equal(refreshed.success, true);
  assert.equal(typeof refreshed.data.token, 'string');
  assert.notEqual(refreshed.data.token.length, 0);

  const projects = await requestJson(baseUrl, 'GET', '/api/projects', {
    expectedStatus: 200,
    token: refreshed.data.token,
  });
  assert.deepEqual(projects.data, []);

  const logout = await requestJson(baseUrl, 'POST', '/api/auth/logout', {
    expectedStatus: 200,
  });
  assert.equal(logout.message, 'Logged out successfully');
});