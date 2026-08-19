import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProject,
  createTask,
  createTestServer,
  loginUser,
  requestJson,
  signupUser,
} from './helpers/apiTestUtils.mjs';

function assertErrorEnvelope(payload, expectedCode) {
  assert.equal(payload.success, false);
  assert.equal(typeof payload.error, 'object');
  assert.equal(payload.error.code, expectedCode);
  assert.equal(typeof payload.error.message, 'string');
  assert.notEqual(payload.error.message.length, 0);
}

function assertSuccessEnvelope(payload) {
  assert.equal(payload.success, true);
  assert.equal(Object.hasOwn(payload, 'data'), true);
}

function assertUserContract(user) {
  assert.equal(typeof user.id, 'string');
  assert.equal(typeof user.name, 'string');
  assert.equal(typeof user.email, 'string');
  assert.equal(['manager', 'worker', 'admin'].includes(user.role), true);
}

function assertProjectContract(project) {
  assert.equal(typeof project.id, 'string');
  assert.equal(typeof project.name, 'string');
  assert.equal(typeof project.description, 'string');
  assert.equal(['planning', 'active', 'on-hold', 'completed'].includes(project.status), true);
  assert.equal(typeof project.progress, 'number');
  assert.equal(typeof project.startDate, 'string');
  assert.equal(typeof project.endDate, 'string');
  assert.equal(typeof project.budget, 'number');
  assert.equal(typeof project.spent, 'number');
}

function assertTaskContract(task) {
  assert.equal(typeof task.id, 'string');
  assert.equal(typeof task.projectId, 'string');
  assert.equal(typeof task.title, 'string');
  assert.equal(typeof task.description, 'string');
  assert.equal(['todo', 'in-progress', 'blocked', 'done'].includes(task.status), true);
  assert.equal(['low', 'medium', 'high'].includes(task.priority), true);
  if (task.assignee !== undefined) {
    assert.equal(typeof task.assignee, 'string');
  }
  assert.equal(typeof task.dueDate, 'string');
  assert.equal(typeof task.createdAt, 'string');
}

test('API success responses match shared auth, project, and task contracts', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-contract-success-');

  const signup = await signupUser(baseUrl, { name: 'Contract User' });
  assertSuccessEnvelope(signup.payload);
  assert.equal(typeof signup.payload.data.token, 'string');
  assertUserContract(signup.payload.data.user);

  const login = await loginUser(baseUrl, {
    email: signup.email,
    password: signup.password,
  });
  assertSuccessEnvelope(login);
  assert.equal(typeof login.data.token, 'string');
  assertUserContract(login.data.user);

  const refreshed = await requestJson(baseUrl, 'POST', '/api/auth/refresh', {
    expectedStatus: 200,
    token: login.data.token,
  });
  assertSuccessEnvelope(refreshed);
  assert.equal(typeof refreshed.data.token, 'string');

  const project = await createProject(baseUrl, login.data.token, {
    name: 'Contract Project',
    budget: 6500,
  });
  assertSuccessEnvelope(project);
  assertProjectContract(project.data);

  const projects = await requestJson(baseUrl, 'GET', '/api/projects', {
    expectedStatus: 200,
    token: login.data.token,
  });
  assertSuccessEnvelope(projects);
  assert.equal(Array.isArray(projects.data), true);
  assert.equal(projects.data.length, 1);
  assertProjectContract(projects.data[0]);

  const task = await createTask(baseUrl, login.data.token, {
    projectId: project.data.id,
    title: 'Contract Task',
    priority: 'medium',
  });
  assertSuccessEnvelope(task);
  assertTaskContract(task.data);

  const tasks = await requestJson(baseUrl, 'GET', '/api/tasks', {
    expectedStatus: 200,
    token: login.data.token,
  });
  assertSuccessEnvelope(tasks);
  assert.equal(Array.isArray(tasks.data), true);
  assert.equal(tasks.data.length, 1);
  assertTaskContract(tasks.data[0]);
});

test('API error responses match shared error contract', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-contract-error-');

  const unauthorizedProjects = await requestJson(baseUrl, 'GET', '/api/projects', {
    expectedStatus: 401,
  });
  assertErrorEnvelope(unauthorizedProjects, 'UNAUTHORIZED');

  const signup = await signupUser(baseUrl, { email: 'contract-error@example.com', name: 'Contract Error' });

  const duplicateSignup = await signupUser(baseUrl, {
    email: 'contract-error@example.com',
    expectedStatus: 409,
  });
  assertErrorEnvelope(duplicateSignup.payload, 'USER_EXISTS');

  const login = await loginUser(baseUrl, {
    email: signup.email,
    password: signup.password,
  });

  const missingProject = await requestJson(baseUrl, 'GET', '/api/projects/missing-project', {
    expectedStatus: 404,
    token: login.data.token,
  });
  assertErrorEnvelope(missingProject, 'PROJECT_NOT_FOUND');

  const missingTaskProject = await requestJson(baseUrl, 'POST', '/api/tasks', {
    expectedStatus: 404,
    token: login.data.token,
    body: {
      projectId: 'missing-project',
      title: 'Missing Project Task',
      description: 'Should fail',
      priority: 'high',
      dueDate: '2026-07-01',
    },
  });
  assertErrorEnvelope(missingTaskProject, 'PROJECT_NOT_FOUND');
});