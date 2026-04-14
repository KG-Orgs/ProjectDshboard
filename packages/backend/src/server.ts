import express from 'express';

import {
  chatSessions,
  features,
  files,
  organization,
  project,
  suggestions,
  syncSnapshot,
  user,
} from './mock/mvp-data';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());
app.use((_, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');

  next();
});

app.get('/api/health', (_, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/auth/me', (_, response) => {
  response.json({ user, organization });
});

app.get('/api/onedrive/status', (_, response) => {
  response.json(syncSnapshot);
});

app.post('/api/onedrive/connect', (_, response) => {
  response.status(201).json({ connected: true, provider: 'onedrive', projectId: project.id });
});

app.post('/api/onedrive/sync', (_, response) => {
  response.status(202).json({ started: true, sync: syncSnapshot });
});

app.get('/api/projects', (_, response) => {
  response.json([project]);
});

app.get('/api/projects/:id', (request, response) => {
  if (request.params.id !== project.id) {
    response.status(404).json({ message: 'Project not found' });
    return;
  }

  response.json({ project, sync: syncSnapshot, suggestedQueries: suggestions });
});

app.get('/api/projects/:id/files', (request, response) => {
  if (request.params.id !== project.id) {
    response.status(404).json({ message: 'Project not found' });
    return;
  }

  response.json(files);
});

app.get('/api/projects/:id/features', (request, response) => {
  if (request.params.id !== project.id) {
    response.status(404).json({ message: 'Project not found' });
    return;
  }

  response.json(features);
});

app.get('/api/features/registry', (_, response) => {
  response.json(features);
});

app.get('/api/chat/sessions', (request, response) => {
  const projectId = request.query.projectId;

  if (projectId && projectId !== project.id) {
    response.json([]);
    return;
  }

  response.json(chatSessions.map(({ messages, ...session }) => session));
});

app.get('/api/chat/sessions/:id/messages', (request, response) => {
  const session = chatSessions.find((entry) => entry.id === request.params.id);

  if (!session) {
    response.status(404).json({ message: 'Session not found' });
    return;
  }

  response.json(session.messages);
});

app.post('/api/chat/sessions', (request, response) => {
  const createdSession = {
    id: `session_${Date.now()}`,
    projectId: request.body.projectId ?? project.id,
    userId: user.id,
    title: 'New project search',
    createdAt: new Date().toISOString(),
  };

  response.status(201).json(createdSession);
});

app.post('/api/chat/sessions/:id/message', (request, response) => {
  const prompt = String(request.body.content ?? '');
  const matchedFile = files.find((file) => prompt.toLowerCase().includes(file.fileName.toLowerCase().split(' ')[0].toLowerCase())) ?? files[0];

  response.json({
    id: `assistant_${Date.now()}`,
    sessionId: request.params.id,
    role: 'assistant',
    content:
      matchedFile.specSection
        ? `I found relevant indexed content in ${matchedFile.fileName}. Spec section ${matchedFile.specSection} is tagged and ready for citation-based chat.`
        : `I found relevant indexed content in ${matchedFile.fileName}. The current revision is ${matchedFile.revision ?? 'not detected yet'}.`,
    sources: [
      {
        fileId: matchedFile.id,
        fileName: matchedFile.fileName,
        chunkId: `${matchedFile.id}_0`,
        relevance: 0.92,
        oneDriveWebUrl: matchedFile.oneDriveWebUrl,
      },
    ],
  });
});

app.listen(port, () => {
  console.log(`ContractorAI backend listening on http://localhost:${port}`);
});