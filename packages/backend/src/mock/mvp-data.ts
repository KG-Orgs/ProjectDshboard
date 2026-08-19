const now = '2026-04-14T12:00:00.000Z';

export const organization = {
  id: 'org_north-ridge',
  name: 'North Ridge Builders',
  oneDriveTenantId: 'tenant-nrb-001',
  createdAt: '2026-01-05T08:30:00.000Z',
};

export const user = {
  id: 'user_amelia-cho',
  orgId: organization.id,
  email: 'amelia@northridge.example',
  name: 'Amelia Cho',
  role: 'admin',
  createdAt: '2026-01-05T08:30:00.000Z',
};

export const project = {
  id: 'proj_building-a',
  orgId: organization.id,
  name: 'Building A Tenant Fit-Out',
  status: 'active',
  oneDriveFolderId: '01ABCDEFROOT',
  syncStatus: 'ready',
  indexedFileCount: 182,
  totalFileCount: 214,
  createdAt: '2026-01-12T14:00:00.000Z',
};

export const files = [
  {
    id: 'file_spec_230500',
    projectId: project.id,
    oneDriveItemId: 'od_spec_230500',
    fileName: '23 05 00 Common Work Results for HVAC.pdf',
    filePath: '/Specs/Division 23/23 05 00 HVAC.pdf',
    fileType: 'pdf',
    fileSize: 842113,
    mimeType: 'application/pdf',
    summary: 'HVAC specification covering insulation materials, execution, and field quality control.',
    keyTopics: ['hvac', 'insulation', 'execution'],
    tags: ['spec', 'division-23', 'mechanical'],
    docCategory: 'spec',
    specSection: '23 05 00',
    revision: 'Issued for Construction',
    oneDriveEtag: 'etag-spec-1',
    oneDriveWebUrl: 'https://onedrive.example/specs/230500',
    lastSynced: now,
    indexStatus: 'indexed',
    lastIndexed: now,
    chunkCount: 16,
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: now,
  },
  {
    id: 'file_sheet_a101',
    projectId: project.id,
    oneDriveItemId: 'od_sheet_a101',
    fileName: 'A101 Floor Plan Rev 3.pdf',
    filePath: '/Drawings/Architectural/A101 Floor Plan Rev 3.pdf',
    fileType: 'pdf',
    fileSize: 1948200,
    mimeType: 'application/pdf',
    summary: 'Current first-floor plan showing partition revisions and updated room tags.',
    keyTopics: ['drawing', 'floor plan', 'architectural'],
    tags: ['drawing', 'revision'],
    docCategory: 'drawing',
    sheetNumber: 'A101',
    revision: 'Rev 3',
    oneDriveEtag: 'etag-a101-3',
    oneDriveWebUrl: 'https://onedrive.example/drawings/a101',
    lastSynced: now,
    indexStatus: 'indexed',
    lastIndexed: now,
    chunkCount: 4,
    createdAt: '2026-02-18T10:00:00.000Z',
    updatedAt: now,
  },
  {
    id: 'file_submittal_hvac',
    projectId: project.id,
    oneDriveItemId: 'od_submittal_hvac',
    fileName: 'HVAC Equipment Submittal Building A.docx',
    filePath: '/Submittals/Mechanical/HVAC Equipment Submittal Building A.docx',
    fileType: 'docx',
    fileSize: 218440,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    summary: 'Mechanical equipment submittal package for rooftop units and insulation product data.',
    keyTopics: ['submittal', 'rtu', 'insulation'],
    tags: ['submittal', 'mechanical'],
    docCategory: 'submittal',
    revision: 'Rev 1',
    oneDriveEtag: 'etag-submittal-1',
    oneDriveWebUrl: 'https://onedrive.example/submittals/hvac',
    lastSynced: now,
    indexStatus: 'processing',
    createdAt: '2026-03-07T10:15:00.000Z',
    updatedAt: now,
    chunkCount: 0,
  },
];

export const features = [
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: 'cloud',
    route: '/projects/proj_building-a/files',
    description: 'Connect OneDrive and keep project documents in sync.',
    enabled: true,
    statusLabel: 'Live in MVP',
    sortOrder: 1,
  },
  {
    id: 'chat',
    name: 'AI Chat',
    icon: 'messages-square',
    route: '/projects/proj_building-a/chat',
    description: 'Ask natural-language questions against indexed project files.',
    enabled: true,
    statusLabel: 'Live in MVP',
    sortOrder: 2,
  },
  {
    id: 'daily_photos',
    name: 'Daily Photos',
    icon: 'camera',
    route: '/projects/proj_building-a/photos',
    description: 'Capture and organize field photos for future rollout.',
    enabled: false,
    statusLabel: 'Planned next',
    sortOrder: 3,
  },
];

export const suggestions = [
  'Find the HVAC submittal for Building A.',
  'What does spec section 23 05 00 say about insulation thickness?',
  'Show me the latest revision of sheet A101.',
];

export const chatSessions = [
  {
    id: 'session_hvac',
    projectId: project.id,
    userId: user.id,
    title: 'HVAC insulation requirements',
    createdAt: '2026-04-14T11:54:00.000Z',
    messages: [
      {
        id: 'msg_user_1',
        sessionId: 'session_hvac',
        role: 'user',
        content: 'What does spec section 23 05 00 say about insulation thickness?',
        sources: [],
        createdAt: '2026-04-14T11:54:00.000Z',
      },
      {
        id: 'msg_assistant_1',
        sessionId: 'session_hvac',
        role: 'assistant',
        content:
          'Section 23 05 00 requires insulation thickness to match the scheduled pipe size and service. The indexed spec also calls for field verification before concealment.',
        sources: [
          {
            fileId: 'file_spec_230500',
            fileName: '23 05 00 Common Work Results for HVAC.pdf',
            chunkId: 'file_spec_230500_12',
            relevance: 0.98,
            oneDriveWebUrl: 'https://onedrive.example/specs/230500',
          },
        ],
        createdAt: '2026-04-14T11:54:04.000Z',
      },
    ],
  },
];

export const syncSnapshot = {
  projectId: project.id,
  status: 'ready',
  indexedFileCount: 182,
  totalFileCount: 214,
  lastSyncStartedAt: '2026-04-14T11:42:00.000Z',
  lastSyncCompletedAt: '2026-04-14T11:49:00.000Z',
  nextSyncEtaMinutes: 15,
};