import { defaultFeatureOrder } from '../features/registry';
import type {
  ChatSession,
  DashboardFeature,
  FileRecord,
  Organization,
  Project,
  QuerySuggestion,
  SyncSnapshot,
  User,
} from '../types/domain';

const now = '2026-04-14T12:00:00.000Z';

export const demoOrganization: Organization = {
  id: 'org_north-ridge',
  name: 'North Ridge Builders',
  oneDriveTenantId: 'tenant-nrb-001',
  createdAt: '2026-01-05T08:30:00.000Z',
};

export const demoUser: User = {
  id: 'user_amelia-cho',
  orgId: demoOrganization.id,
  email: 'amelia@northridge.example',
  name: 'Amelia Cho',
  role: 'admin',
  createdAt: '2026-01-05T08:30:00.000Z',
};

export const demoProjects: Project[] = [
  {
    id: 'proj_building-a',
    orgId: demoOrganization.id,
    name: 'Building A Tenant Fit-Out',
    status: 'active',
    oneDriveFolderId: '01ABCDEFROOT',
    syncStatus: 'ready',
    indexedFileCount: 182,
    totalFileCount: 214,
    createdAt: '2026-01-12T14:00:00.000Z',
  },
];

export const demoFiles: FileRecord[] = [
  {
    id: 'file_spec_230500',
    projectId: demoProjects[0].id,
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
    projectId: demoProjects[0].id,
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
    projectId: demoProjects[0].id,
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

export const demoSyncSnapshot: SyncSnapshot = {
  projectId: demoProjects[0].id,
  status: 'ready',
  indexedFileCount: 182,
  totalFileCount: 214,
  lastSyncStartedAt: '2026-04-14T11:42:00.000Z',
  lastSyncCompletedAt: '2026-04-14T11:49:00.000Z',
  nextSyncEtaMinutes: 15,
};

export const demoChatSessions: ChatSession[] = [
  {
    id: 'session_hvac',
    projectId: demoProjects[0].id,
    userId: demoUser.id,
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
          'Section 23 05 00 requires insulation thickness to match the scheduled pipe size and service. The indexed spec also calls for field verification before concealment. Review the mechanical spec and current HVAC submittal for the exact product match.',
        sources: [
          {
            fileId: 'file_spec_230500',
            fileName: '23 05 00 Common Work Results for HVAC.pdf',
            chunkId: 'file_spec_230500_12',
            relevance: 0.98,
            oneDriveWebUrl: 'https://onedrive.example/specs/230500',
          },
          {
            fileId: 'file_submittal_hvac',
            fileName: 'HVAC Equipment Submittal Building A.docx',
            chunkId: 'file_submittal_hvac_01',
            relevance: 0.81,
            oneDriveWebUrl: 'https://onedrive.example/submittals/hvac',
          },
        ],
        createdAt: '2026-04-14T11:54:04.000Z',
      },
    ],
  },
];

export const demoDashboardFeatures: DashboardFeature[] = defaultFeatureOrder.map((feature) => ({
  ...feature,
  enabled: feature.enabledByDefault,
  statusLabel: feature.enabledByDefault ? 'Live in MVP' : 'Planned next',
}));

export const onboardingChecklist = [
  'Sign in with Microsoft',
  'Connect OneDrive tenant',
  'Choose project folder',
  'Index first 50 files',
  'Ask first chat question',
];

export const demoQuerySuggestions: QuerySuggestion[] = [
  {
    id: 'q1',
    label: 'HVAC spec section',
    prompt: 'What does spec section 23 05 00 say about insulation thickness?',
  },
  {
    id: 'q2',
    label: 'Latest architectural drawing',
    prompt: 'Show me the latest revision of sheet A101.',
  },
  {
    id: 'q3',
    label: 'Mechanical submittal',
    prompt: 'Find the HVAC submittal for Building A.',
  },
];