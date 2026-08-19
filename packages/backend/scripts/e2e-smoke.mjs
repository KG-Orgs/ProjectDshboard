const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const email = `e2e-${Date.now()}@example.com`;
const password = 'password123';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(method, path, { expectedStatus, token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
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
    assert(
      response.status === expectedStatus,
      `${method} ${path} expected ${expectedStatus} but got ${response.status}: ${text}`
    );
  }

  return { status: response.status, payload };
}

async function main() {
  console.log(`Running backend E2E smoke test against ${baseUrl}`);

  const health = await request('GET', '/api/health', { expectedStatus: 200 });
  assert(health.payload.status === 'ok', 'Health endpoint did not return ok status');

  await request('GET', '/api/projects', { expectedStatus: 401 });

  const signup = await request('POST', '/api/auth/signup', {
    expectedStatus: 201,
    body: { email, password, name: 'E2E User' },
  });
  assert(signup.payload.success, 'Signup should succeed');

  const login = await request('POST', '/api/auth/login', {
    expectedStatus: 200,
    body: { email, password },
  });
  assert(login.payload.success, 'Login should succeed');

  const token = login.payload.data.token;
  assert(typeof token === 'string' && token.length > 0, 'Login did not return a token');

  const refreshed = await request('POST', '/api/auth/refresh', {
    expectedStatus: 200,
    token,
  });
  assert(refreshed.payload.data.token, 'Refresh did not return a token');

  const projects = await request('GET', '/api/projects', {
    expectedStatus: 200,
    token,
  });
  assert(Array.isArray(projects.payload.data), 'Projects response should be an array');
  assert(projects.payload.data.length === 0, 'New user should start with no projects');

  const createdProject = await request('POST', '/api/projects', {
    expectedStatus: 201,
    token,
    body: {
      name: 'E2E Project',
      description: 'Created by smoke test',
      budget: 100000,
      endDate: '2026-12-31',
    },
  });
  const projectId = createdProject.payload.data.id;
  assert(createdProject.payload.data.name === 'E2E Project', 'Project creation response mismatch');

  const tasks = await request('GET', '/api/tasks', {
    expectedStatus: 200,
    token,
  });
  assert(Array.isArray(tasks.payload.data), 'Tasks response should be an array');
  assert(tasks.payload.data.length === 0, 'New user should start with no tasks');

  const createdTask = await request('POST', '/api/tasks', {
    expectedStatus: 201,
    token,
    body: {
      projectId,
      title: 'E2E Task',
      description: 'Created by smoke test',
      priority: 'high',
      dueDate: '2026-06-01',
    },
  });
  const taskId = createdTask.payload.data.id;
  assert(createdTask.payload.data.title === 'E2E Task', 'Task creation response mismatch');

  const filteredTasks = await request('GET', `/api/tasks?projectId=${projectId}&status=todo`, {
    expectedStatus: 200,
    token,
  });
  assert(filteredTasks.payload.data.length === 1, 'Task filters should return the created task');

  await request('PATCH', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
    body: { status: 'active', progress: 10 },
  });

  await request('PATCH', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
    body: { status: 'done' },
  });

  await request('GET', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
  });

  await request('DELETE', `/api/tasks/${taskId}`, {
    expectedStatus: 200,
    token,
  });

  await request('DELETE', `/api/projects/${projectId}`, {
    expectedStatus: 200,
    token,
  });

  await request('POST', '/api/auth/logout', { expectedStatus: 200 });

  console.log('Backend E2E smoke test passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});