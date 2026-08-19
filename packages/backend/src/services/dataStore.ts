import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { Project, Task, User } from '@contractor/shared';
import { AuthService } from './authService';

interface StoredUser extends User {
  passwordHash: string;
  createdAt: string;
}

interface StoredProject extends Project {
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredTask extends Task {
  ownerId: string;
  updatedAt: string;
}

interface StoreData {
  users: StoredUser[];
  projects: StoredProject[];
  tasks: StoredTask[];
}

type CreateProjectInput = Pick<Project, 'name' | 'description' | 'budget' | 'endDate'>;

type UpdateProjectInput = Partial<
  Pick<Project, 'name' | 'description' | 'status' | 'progress' | 'budget' | 'spent' | 'endDate'>
>;

type CreateTaskInput = Pick<
  Task,
  'projectId' | 'title' | 'description' | 'priority' | 'dueDate'
> & Partial<Pick<Task, 'assignee' | 'status'>>;

type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assignee' | 'dueDate'>
>;

const emptyStore = (): StoreData => ({
  users: [],
  projects: [],
  tasks: [],
});

const publicUser = ({ passwordHash: _passwordHash, createdAt: _createdAt, ...user }: StoredUser): User => user;

const publicProject = ({ ownerId: _ownerId, createdAt: _createdAt, updatedAt: _updatedAt, ...project }: StoredProject): Project => project;

const publicTask = ({ ownerId: _ownerId, updatedAt: _updatedAt, ...task }: StoredTask): Task => task;

export class FileDataStore {
  private readonly dataDir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), '.data'));

  private readonly dataFile = path.join(this.dataDir, 'store.json');

  private writeQueue: Promise<void> = Promise.resolve();

  private async ensureStoreFile(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    try {
      await fs.access(this.dataFile);
    } catch {
      await fs.writeFile(this.dataFile, JSON.stringify(emptyStore(), null, 2));
    }
  }

  private async readStore(): Promise<StoreData> {
    await this.ensureStoreFile();
    const raw = await fs.readFile(this.dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users as StoredUser[] : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects as StoredProject[] : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks as StoredTask[] : [],
    };
  }

  private async writeStore(store: StoreData): Promise<void> {
    await fs.writeFile(this.dataFile, JSON.stringify(store, null, 2));
  }

  private enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(operation, operation);
    this.writeQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  async registerUser(input: {
    email: string;
    password: string;
    name: string;
    role?: User['role'];
  }): Promise<User | null> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const normalizedEmail = input.email.trim().toLowerCase();

      if (store.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        return null;
      }

      const storedUser: StoredUser = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name: input.name.trim(),
        role: input.role || 'worker',
        passwordHash: AuthService.hashPassword(input.password),
        createdAt: new Date().toISOString(),
      };

      store.users.push(storedUser);
      await this.writeStore(store);
      return publicUser(storedUser);
    });
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const store = await this.readStore();
    const normalizedEmail = email.trim().toLowerCase();
    const storedUser = store.users.find((user) => user.email.toLowerCase() === normalizedEmail);

    if (!storedUser) {
      return null;
    }

    if (!AuthService.verifyPassword(password, storedUser.passwordHash)) {
      return null;
    }

    return publicUser(storedUser);
  }

  async listProjects(ownerId: string): Promise<Project[]> {
    const store = await this.readStore();
    return store.projects
      .filter((project) => project.ownerId === ownerId)
      .map(publicProject);
  }

  async getProject(ownerId: string, projectId: string): Promise<Project | null> {
    const store = await this.readStore();
    const project = store.projects.find(
      (item) => item.ownerId === ownerId && item.id === projectId
    );

    return project ? publicProject(project) : null;
  }

  async createProject(ownerId: string, input: CreateProjectInput): Promise<Project> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const now = new Date().toISOString();
      const storedProject: StoredProject = {
        id: crypto.randomUUID(),
        ownerId,
        name: input.name.trim(),
        description: input.description?.trim() || '',
        status: 'planning',
        progress: 0,
        startDate: now.split('T')[0],
        endDate: input.endDate || '',
        budget: input.budget,
        spent: 0,
        createdAt: now,
        updatedAt: now,
      };

      store.projects.push(storedProject);
      await this.writeStore(store);
      return publicProject(storedProject);
    });
  }

  async updateProject(ownerId: string, projectId: string, updates: UpdateProjectInput): Promise<Project | null> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const project = store.projects.find(
        (item) => item.ownerId === ownerId && item.id === projectId
      );

      if (!project) {
        return null;
      }

      if (updates.name !== undefined) {
        project.name = updates.name.trim();
      }

      if (updates.description !== undefined) {
        project.description = updates.description?.trim() || '';
      }

      if (updates.status !== undefined) {
        project.status = updates.status;
      }

      if (updates.progress !== undefined) {
        project.progress = updates.progress;
      }

      if (updates.budget !== undefined) {
        project.budget = updates.budget;
      }

      if (updates.spent !== undefined) {
        project.spent = updates.spent;
      }

      if (updates.endDate !== undefined) {
        project.endDate = updates.endDate;
      }

      project.updatedAt = new Date().toISOString();
      await this.writeStore(store);
      return publicProject(project);
    });
  }

  async deleteProject(ownerId: string, projectId: string): Promise<boolean> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const nextProjects = store.projects.filter(
        (project) => !(project.ownerId === ownerId && project.id === projectId)
      );

      if (nextProjects.length === store.projects.length) {
        return false;
      }

      store.projects = nextProjects;
      store.tasks = store.tasks.filter(
        (task) => !(task.ownerId === ownerId && task.projectId === projectId)
      );
      await this.writeStore(store);
      return true;
    });
  }

  async listTasks(ownerId: string, filters: { projectId?: string; status?: string }): Promise<Task[]> {
    const store = await this.readStore();
    return store.tasks
      .filter((task) => task.ownerId === ownerId)
      .filter((task) => !filters.projectId || task.projectId === filters.projectId)
      .filter((task) => !filters.status || task.status === filters.status)
      .map(publicTask);
  }

  async getTask(ownerId: string, taskId: string): Promise<Task | null> {
    const store = await this.readStore();
    const task = store.tasks.find((item) => item.ownerId === ownerId && item.id === taskId);
    return task ? publicTask(task) : null;
  }

  async createTask(ownerId: string, input: CreateTaskInput): Promise<Task | null> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const project = store.projects.find(
        (item) => item.ownerId === ownerId && item.id === input.projectId
      );

      if (!project) {
        return null;
      }

      const now = new Date().toISOString();
      const task: StoredTask = {
        id: crypto.randomUUID(),
        ownerId,
        projectId: input.projectId,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        status: input.status || 'todo',
        priority: input.priority,
        assignee: input.assignee?.trim(),
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      };

      store.tasks.push(task);
      await this.writeStore(store);
      return publicTask(task);
    });
  }

  async updateTask(ownerId: string, taskId: string, updates: UpdateTaskInput): Promise<Task | null> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const task = store.tasks.find((item) => item.ownerId === ownerId && item.id === taskId);

      if (!task) {
        return null;
      }

      if (updates.title !== undefined) {
        task.title = updates.title.trim();
      }

      if (updates.description !== undefined) {
        task.description = updates.description?.trim() || '';
      }

      if (updates.status !== undefined) {
        task.status = updates.status;
      }

      if (updates.priority !== undefined) {
        task.priority = updates.priority;
      }

      if (updates.assignee !== undefined) {
        task.assignee = updates.assignee?.trim();
      }

      if (updates.dueDate !== undefined) {
        task.dueDate = updates.dueDate;
      }

      task.updatedAt = new Date().toISOString();
      await this.writeStore(store);
      return publicTask(task);
    });
  }

  async deleteTask(ownerId: string, taskId: string): Promise<boolean> {
    return this.enqueueWrite(async () => {
      const store = await this.readStore();
      const nextTasks = store.tasks.filter(
        (task) => !(task.ownerId === ownerId && task.id === taskId)
      );

      if (nextTasks.length === store.tasks.length) {
        return false;
      }

      store.tasks = nextTasks;
      await this.writeStore(store);
      return true;
    });
  }
}

export const dataStore = new FileDataStore();