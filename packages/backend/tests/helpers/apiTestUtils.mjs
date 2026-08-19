import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

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

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to reserve an ephemeral port')));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on('error', reject);
  });
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

  try {
    await waitForHealth(baseUrl);
  } catch (error) {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
    }

    error.message = `${error.message}\n${logs.join('')}`;
    throw error;
  }

  return {
    baseUrl,
    logs,
    async stop() {
      if (child.exitCode !== null) {
        return;
      }

      child.kill('SIGTERM');
      await new Promise((resolve) => child.once('exit', resolve));
    },
  };
}

export async function createTestServer(t, prefix = 'backend-feature-') {
  const dataDir = await mkdtemp(path.join(tmpdir(), prefix));
  t.after(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  const port = await reservePort();
  const server = await startServer({ dataDir, port });
  t.after(async () => {
    await server.stop();
  });

  return {
    dataDir,
    baseUrl: server.baseUrl,
    logs: server.logs,
  };
}

export async function requestJson(baseUrl, method, pathname, { body, token, expectedStatus } = {}) {
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

  if (expectedStatus !== undefined) {
    assert.equal(
      response.status,
      expectedStatus,
      `${method} ${pathname} expected ${expectedStatus} but got ${response.status}: ${text}`
    );
  }

  return payload;
}

export function uniqueEmail(prefix = 'user') {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}@example.com`;
}

export async function signupUser(baseUrl, overrides = {}) {
  const email = overrides.email ?? uniqueEmail('signup');
  const password = overrides.password ?? 'password123';
  const name = overrides.name ?? 'Test User';

  const payload = await requestJson(baseUrl, 'POST', '/api/auth/signup', {
    expectedStatus: overrides.expectedStatus ?? 201,
    body: { email, password, name },
  });

  return { email, password, name, payload };
}

export async function loginUser(baseUrl, { email, password, expectedStatus = 200 }) {
  const payload = await requestJson(baseUrl, 'POST', '/api/auth/login', {
    expectedStatus,
    body: { email, password },
  });

  return payload;
}

export async function createProject(baseUrl, token, overrides = {}) {
  return requestJson(baseUrl, 'POST', '/api/projects', {
    expectedStatus: overrides.expectedStatus ?? 201,
    token,
    body: {
      name: overrides.name ?? 'Test Project',
      description: overrides.description ?? 'Created by integration tests',
      budget: overrides.budget ?? 5000,
      endDate: overrides.endDate ?? '2026-12-31',
    },
  });
}

export async function createTask(baseUrl, token, overrides = {}) {
  return requestJson(baseUrl, 'POST', '/api/tasks', {
    expectedStatus: overrides.expectedStatus ?? 201,
    token,
    body: {
      projectId: overrides.projectId,
      title: overrides.title ?? 'Test Task',
      description: overrides.description ?? 'Created by integration tests',
      priority: overrides.priority ?? 'medium',
      dueDate: overrides.dueDate ?? '2026-06-01',
    },
  });
}