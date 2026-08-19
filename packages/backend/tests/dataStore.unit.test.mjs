import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

async function createStore(t) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'backend-datastore-unit-'));
  const originalDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = dataDir;

  const { FileDataStore } = await import(`../dist/services/dataStore.js?ts=${Date.now()}-${Math.random()}`);
  const store = new FileDataStore();

  t.after(async () => {
    if (originalDataDir === undefined) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = originalDataDir;
    }

    await rm(dataDir, { recursive: true, force: true });
  });

  return store;
}

test('FileDataStore normalizes users and authenticates valid credentials', async (t) => {
  const store = await createStore(t);

  const registeredUser = await store.registerUser({
    email: '  USER@Example.com ',
    password: 'password123',
    name: '  Unit User  ',
    role: 'worker',
  });

  assert.equal(registeredUser.email, 'user@example.com');
  assert.equal(registeredUser.name, 'Unit User');
  assert.equal(Object.hasOwn(registeredUser, 'passwordHash'), false);

  const duplicate = await store.registerUser({
    email: 'user@example.com',
    password: 'password123',
    name: 'Duplicate User',
  });
  assert.equal(duplicate, null);

  const authenticated = await store.authenticateUser('USER@example.com', 'password123');
  assert.equal(authenticated.email, 'user@example.com');

  const rejected = await store.authenticateUser('user@example.com', 'wrong-password');
  assert.equal(rejected, null);
});

test('FileDataStore stores, filters, updates, and cascades project tasks', async (t) => {
  const store = await createStore(t);

  const user = await store.registerUser({
    email: 'owner@example.com',
    password: 'password123',
    name: 'Owner',
  });

  const project = await store.createProject(user.id, {
    name: '  Unit Project  ',
    description: '  Store project  ',
    budget: 9000,
    endDate: '2026-12-31',
  });

  assert.equal(project.name, 'Unit Project');
  assert.equal(project.description, 'Store project');
  assert.equal(project.status, 'planning');

  const task = await store.createTask(user.id, {
    projectId: project.id,
    title: '  Unit Task  ',
    description: '  Store task  ',
    priority: 'high',
    dueDate: '2026-06-01',
    assignee: '  Owner  ',
  });

  assert.equal(task.title, 'Unit Task');
  assert.equal(task.assignee, 'Owner');
  assert.equal(task.status, 'todo');

  const allTasks = await store.listTasks(user.id, {});
  assert.equal(allTasks.length, 1);

  const filteredTasks = await store.listTasks(user.id, {
    projectId: project.id,
    status: 'todo',
  });
  assert.equal(filteredTasks.length, 1);

  const updatedProject = await store.updateProject(user.id, project.id, {
    name: '  Updated Project  ',
    progress: 40,
    spent: 1234,
  });
  assert.equal(updatedProject.name, 'Updated Project');
  assert.equal(updatedProject.progress, 40);
  assert.equal(updatedProject.spent, 1234);

  const updatedTask = await store.updateTask(user.id, task.id, {
    title: '  Updated Task  ',
    description: '  Updated description  ',
    status: 'done',
    assignee: '  Owner Updated  ',
  });
  assert.equal(updatedTask.title, 'Updated Task');
  assert.equal(updatedTask.description, 'Updated description');
  assert.equal(updatedTask.status, 'done');
  assert.equal(updatedTask.assignee, 'Owner Updated');

  const deletedProject = await store.deleteProject(user.id, project.id);
  assert.equal(deletedProject, true);

  const missingTask = await store.getTask(user.id, task.id);
  assert.equal(missingTask, null);
});

test('FileDataStore enforces owner boundaries and missing-resource behavior', async (t) => {
  const store = await createStore(t);

  const owner = await store.registerUser({
    email: 'owner2@example.com',
    password: 'password123',
    name: 'Owner 2',
  });
  const otherUser = await store.registerUser({
    email: 'other@example.com',
    password: 'password123',
    name: 'Other User',
  });

  const project = await store.createProject(owner.id, {
    name: 'Owner Project',
    description: '',
    budget: 1000,
    endDate: '',
  });

  const missingTaskCreate = await store.createTask(otherUser.id, {
    projectId: project.id,
    title: 'Should fail',
    description: '',
    priority: 'medium',
    dueDate: '',
  });
  assert.equal(missingTaskCreate, null);

  const invisibleProject = await store.getProject(otherUser.id, project.id);
  assert.equal(invisibleProject, null);

  const updateMissingProject = await store.updateProject(otherUser.id, project.id, { status: 'active' });
  assert.equal(updateMissingProject, null);

  const deleteMissingProject = await store.deleteProject(otherUser.id, project.id);
  assert.equal(deleteMissingProject, false);

  const deleteMissingTask = await store.deleteTask(owner.id, 'missing-task');
  assert.equal(deleteMissingTask, false);
});