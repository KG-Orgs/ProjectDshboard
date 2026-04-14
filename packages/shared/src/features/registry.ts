import type { FeatureDefinition } from '../types/domain';

export const featureRegistry: Record<string, FeatureDefinition> = {
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    icon: 'cloud',
    route: '/projects/:id/files',
    description: 'Connect OneDrive and keep project documents in sync.',
    enabledByDefault: true,
    supportedPlatforms: ['ios', 'android', 'web'],
    contributesToChat: true,
    sortOrder: 1,
  },
  chat: {
    id: 'chat',
    name: 'AI Chat',
    icon: 'messages-square',
    route: '/projects/:id/chat',
    description: 'Ask natural-language questions against indexed project files.',
    enabledByDefault: true,
    supportedPlatforms: ['ios', 'android', 'web'],
    contributesToChat: true,
    sortOrder: 2,
  },
  daily_photos: {
    id: 'daily_photos',
    name: 'Daily Photos',
    icon: 'camera',
    route: '/projects/:id/photos',
    description: 'Capture and organize field photos for future rollout.',
    enabledByDefault: false,
    supportedPlatforms: ['ios', 'android', 'web'],
    contributesToChat: true,
    sortOrder: 3,
  },
  daily_reports: {
    id: 'daily_reports',
    name: 'Daily Reports',
    icon: 'clipboard-list',
    route: '/projects/:id/reports',
    description: 'Structured daily reports and exports planned after MVP.',
    enabledByDefault: false,
    supportedPlatforms: ['ios', 'android', 'web'],
    contributesToChat: true,
    sortOrder: 4,
  },
  timesheets: {
    id: 'timesheets',
    name: 'Timesheets',
    icon: 'clock-3',
    route: '/projects/:id/timesheets',
    description: 'Labor tracking reserved for later phases.',
    enabledByDefault: false,
    supportedPlatforms: ['ios', 'android', 'web'],
    contributesToChat: false,
    sortOrder: 5,
  },
};

export const defaultFeatureOrder = Object.values(featureRegistry).sort(
  (left, right) => left.sortOrder - right.sortOrder,
);