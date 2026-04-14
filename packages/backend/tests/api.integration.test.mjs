import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const backendDir = path.resolve(process.cwd());

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Server at ${baseUrl} did not become healthy in time`);
}

async function startServer({ dataDir, port }) {
  const logs = [];
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: dataDir,
      ENABLE_REDIS_QUEUES: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    logs.push(chunk.toString());
  });

  child.stderr.on('data', (chunk) => {
    logs.push(chunk.toString());
  });

  child.on('error', (error) => {
    logs.push(error.message);
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl);

  return {
    baseUrl,
    async stop() {
      if (child.exitCode !== null) {
        return;
      }

      child.kill('SIGTERM');
      await new Promise((resolve) => child.once('exit', resolve));
    },
    logs,
  };
}

async function request(baseUrl, method, pathname, { body, token, expectedStatus } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  assert.equal(
    response.status,
    expectedStatus,
    `${method} ${pathname} expected ${expectedStatus} but got ${response.status}: ${text}`
  );

  return payload;
}

test('backend CRUD flow persists created resources', async (t) => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'backend-crud-'));
  t.after(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  const server = await startServer({ dataDir, port: 3401 });
  t.after(async () => {
    await server.stop();
  });

  await request(server.baseUrl, 'GET', '/api/projects', { expectedStatus: 401 });

  const signup = await request(server.baseUrl, 'POST', '/api/auth/signup', {
    expectedStatus: 201,
    body: {
      email: 'crud@example.com',
      password: 'password123',
      name: 'CRUD User',
    },
  });

  assert.equal(signup.data.user.email, 'crud@example.com');

  const login = await request(server.baseUrl, 'POST', '/api/auth/login', {
    expectedStatus: 200,
    body: {
      email: 'crud@example.com',
      password: 'password123',
    },
  });

  const token = login.data.token;

  const createdProject = await request(server.baseUrl, 'POST', '/api/projects', {
    expectedStatus: 201,
    token,
    body: {
      name: 'Integration Project',
      description: 'Created by integration test',
      budget: 5000,
      endDate: '2026-12-31',
    },
  });

  const projectId = createdProject.data.id;

  const createdTask = await request(server.baseUrl, 'POST', '/api/tasks', {
    expectedStatus: 201,
    token,
    body: {
      projectId,
      title: 'Integration Task',
      description: 'Created by integration test',
      priority: 'high',
      dueDate: '2026-06-01',
    },
  });

  const taskId = createdTask.data.id;

  const filteredTasks = await request(
    server.baseUrl,
    'GET',
    `/api/tasks?projectId=${projectId}&status=todo`,
    { expectedStatus: 200, token }
  );

  assert.equal(filteredTasks.data.length, 1);
  assert.equal(filteredTasks.data[0].id, taskId);

  const updatedProject = await request(server.baseUrl, 'PATCH', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
    body: { status: 'active', progress: 50 },
  });
  assert.equal(updatedProject.data.status, 'active');

  const updatedTask = await request(server.baseUrl, 'PATCH', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
    body: { status: 'done', assignee: 'CRUD User' },
  });
  assert.equal(updatedTask.data.status, 'done');

  await request(server.baseUrl, 'DELETE', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
  });

  await request(server.baseUrl, 'GET', `/api/tasks/${taskId}`, {
    expectedStatus: 404,
    token,
  });

  await request(server.baseUrl, 'DELETE', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
  });

  const finalProjects = await request(server.baseUrl, 'GET', '/api/projects', {
    expectedStatus: 200,
    token,
  });
  assert.equal(finalProjects.data.length, 0);
});

test('backend data survives restart', async (t) => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'backend-restart-'));
  t.after(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  const firstServer = await startServer({ dataDir, port: 3402 });

  const signup = await request(firstServer.baseUrl, 'POST', '/api/auth/signup', {
    expectedStatus: 201,
    body: {
      email: 'restart@example.com',
      password: 'password123',
      name: 'Restart User',
    },
  });

  const token = signup.data.token;

  const project = await request(firstServer.baseUrl, 'POST', '/api/projects', {
    expectedStatus: 201,
    token,
    body: {
      name: 'Restart Project',
      description: 'Should survive restart',
      budget: 2500,
      endDate: '2026-08-31',
    },
  });

  const task = await request(firstServer.baseUrl, 'POST', '/api/tasks', {
    expectedStatus: 201,
    token,
    body: {
      projectId: project.data.id,
      title: 'Restart Task',
      description: 'Should survive restart',
      priority: 'medium',
      dueDate: '2026-05-15',
    },
  });

  await firstServer.stop();

  const secondServer = await startServer({ dataDir, port: 3403 });
  t.after(async () => {
    await secondServer.stop();
  });

  const login = await request(secondServer.baseUrl, 'POST', '/api/auth/login', {
    expectedStatus: 200,
    body: {
      email: 'restart@example.com',
      password: 'password123',
    },
  });

  const restartedToken = login.data.token;

  const projects = await request(secondServer.baseUrl, 'GET', '/api/projects', {
    expectedStatus: 200,
    token: restartedToken,
  });
  assert.equal(projects.data.length, 1);
  assert.equal(projects.data[0].id, project.data.id);

  const tasks = await request(secondServer.baseUrl, 'GET', `/api/tasks?projectId=${project.data.id}`, {
    expectedStatus: 200,
    token: restartedToken,
  });
  assert.equal(tasks.data.length, 1);
  assert.equal(tasks.data[0].id, task.data.id);
});