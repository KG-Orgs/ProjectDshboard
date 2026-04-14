import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProject,
  createTestServer,
  loginUser,
  requestJson,
  signupUser,
} from './helpers/apiTestUtils.mjs';

test('projects validate input and support CRUD for the owner', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-projects-crud-');

  const unauthorized = await requestJson(baseUrl, 'GET', '/api/projects', {
    expectedStatus: 401,
  });
  assert.equal(unauthorized.error.code, 'UNAUTHORIZED');

  const signup = await signupUser(baseUrl, { name: 'Project Owner' });
  const login = await loginUser(baseUrl, {
    email: signup.email,
    password: signup.password,
  });
  const token = login.data.token;

  const invalidCreate = await requestJson(baseUrl, 'POST', '/api/projects', {
    expectedStatus: 400,
    token,
    body: { description: 'missing fields' },
  });
  assert.equal(invalidCreate.error.code, 'INVALID_REQUEST');

  const createdProject = await createProject(baseUrl, token, {
    name: 'Feature Project',
    budget: 12000,
  });
  const projectId = createdProject.data.id;

  const list = await requestJson(baseUrl, 'GET', '/api/projects', {
    expectedStatus: 200,
    token,
  });
  assert.equal(list.data.length, 1);
  assert.equal(list.data[0].id, projectId);

  const fetched = await requestJson(baseUrl, 'GET', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
  });
  assert.equal(fetched.data.name, 'Feature Project');

  const updated = await requestJson(baseUrl, 'PATCH', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
    body: { status: 'active', progress: 75 },
  });
  assert.equal(updated.data.status, 'active');
  assert.equal(updated.data.progress, 75);

  const deleted = await requestJson(baseUrl, 'DELETE', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
  });
  assert.equal(deleted.message, 'Project deleted');

  const missing = await requestJson(baseUrl, 'GET', `/api/projects/${projectId}`, {
    expectedStatus: 404,
    token,
  });
  assert.equal(missing.error.code, 'PROJECT_NOT_FOUND');
});

test('projects stay isolated between different users', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-projects-ownership-');

  const ownerSignup = await signupUser(baseUrl, { name: 'Owner User' });
  const ownerLogin = await loginUser(baseUrl, {
    email: ownerSignup.email,
    password: ownerSignup.password,
  });

  const otherSignup = await signupUser(baseUrl, { name: 'Other User' });
  const otherLogin = await loginUser(baseUrl, {
    email: otherSignup.email,
    password: otherSignup.password,
  });

  const createdProject = await createProject(baseUrl, ownerLogin.data.token, {
    name: 'Owner Only Project',
  });
  const projectId = createdProject.data.id;

  const hiddenFromOtherUser = await requestJson(baseUrl, 'GET', `/api/projects/${projectId}`, {
    expectedStatus: 404,
    token: otherLogin.data.token,
  });
  assert.equal(hiddenFromOtherUser.error.code, 'PROJECT_NOT_FOUND');

  const updateDenied = await requestJson(baseUrl, 'PATCH', `/api/projects/${projectId}`, {
    expectedStatus: 404,
    token: otherLogin.data.token,
    body: { status: 'completed' },
  });
  assert.equal(updateDenied.error.code, 'PROJECT_NOT_FOUND');

  const deleteDenied = await requestJson(baseUrl, 'DELETE', `/api/projects/${projectId}`, {
    expectedStatus: 404,
    token: otherLogin.data.token,
  });
  assert.equal(deleteDenied.error.code, 'PROJECT_NOT_FOUND');

  const ownerStillSeesProject = await requestJson(baseUrl, 'GET', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token: ownerLogin.data.token,
  });
  assert.equal(ownerStillSeesProject.data.name, 'Owner Only Project');
});