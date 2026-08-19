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

test('tasks validate project ownership, filtering, CRUD, and cascade deletion', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-tasks-crud-');

  const signup = await signupUser(baseUrl, { name: 'Task Owner' });
  const login = await loginUser(baseUrl, {
    email: signup.email,
    password: signup.password,
  });
  const token = login.data.token;

  const invalidTask = await requestJson(baseUrl, 'POST', '/api/tasks', {
    expectedStatus: 400,
    token,
    body: { description: 'missing fields' },
  });
  assert.equal(invalidTask.error.code, 'INVALID_REQUEST');

  const missingProject = await createTask(baseUrl, token, {
    expectedStatus: 404,
    projectId: 'does-not-exist',
  });
  assert.equal(missingProject.error.code, 'PROJECT_NOT_FOUND');

  const project = await createProject(baseUrl, token, { name: 'Task Feature Project' });

  const createdTask = await createTask(baseUrl, token, {
    projectId: project.data.id,
    title: 'Feature Task',
    priority: 'high',
  });
  const taskId = createdTask.data.id;

  const filtered = await requestJson(
    baseUrl,
    'GET',
    `/api/tasks?projectId=${project.data.id}&status=todo`,
    { expectedStatus: 200, token }
  );
  assert.equal(filtered.data.length, 1);
  assert.equal(filtered.data[0].id, taskId);

  const updated = await requestJson(baseUrl, 'PATCH', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
    body: { status: 'done', assignee: 'Task Owner' },
  });
  assert.equal(updated.data.status, 'done');
  assert.equal(updated.data.assignee, 'Task Owner');

  const fetched = await requestJson(baseUrl, 'GET', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
  });
  assert.equal(fetched.data.id, taskId);

  await requestJson(baseUrl, 'DELETE', `/api/projects/${project.data.id}`, {
    expectedStatus: 200,
    token,
  });

  const deletedWithProject = await requestJson(baseUrl, 'GET', `/api/tasks/${taskId}`, {
    expectedStatus: 404,
    token,
  });
  assert.equal(deletedWithProject.error.code, 'TASK_NOT_FOUND');
});

test('tasks stay isolated between different users', async (t) => {
  const { baseUrl } = await createTestServer(t, 'backend-tasks-ownership-');

  const ownerSignup = await signupUser(baseUrl, { name: 'Task Owner' });
  const ownerLogin = await loginUser(baseUrl, {
    email: ownerSignup.email,
    password: ownerSignup.password,
  });

  const otherSignup = await signupUser(baseUrl, { name: 'Task Intruder' });
  const otherLogin = await loginUser(baseUrl, {
    email: otherSignup.email,
    password: otherSignup.password,
  });

  const project = await createProject(baseUrl, ownerLogin.data.token, { name: 'Owner Project' });
  const createdTask = await createTask(baseUrl, ownerLogin.data.token, {
    projectId: project.data.id,
    title: 'Owner Task',
  });
  const taskId = createdTask.data.id;

  const hiddenFromOtherUser = await requestJson(baseUrl, 'GET', `/api/tasks/${taskId}`, {
    expectedStatus: 404,
    token: otherLogin.data.token,
  });
  assert.equal(hiddenFromOtherUser.error.code, 'TASK_NOT_FOUND');

  const updateDenied = await requestJson(baseUrl, 'PATCH', `/api/tasks/${taskId}`, {
    expectedStatus: 404,
    token: otherLogin.data.token,
    body: { status: 'done' },
  });
  assert.equal(updateDenied.error.code, 'TASK_NOT_FOUND');

  const deleteDenied = await requestJson(baseUrl, 'DELETE', `/api/tasks/${taskId}`, {
    expectedStatus: 404,
    token: otherLogin.data.token,
  });
  assert.equal(deleteDenied.error.code, 'TASK_NOT_FOUND');

  const ownerStillSeesTask = await requestJson(baseUrl, 'GET', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token: ownerLogin.data.token,
  });
  assert.equal(ownerStillSeesTask.data.title, 'Owner Task');
});