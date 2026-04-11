import axios from 'axios';

export interface OneDriveToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OneDriveConnectionStatus {
  connected: boolean;
  lastSyncedAt?: string;
  nextSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastErrorMessage?: string;
}

export interface OneDriveFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modifiedAt: string;
}

export class OneDriveService {
  private static GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

  /**
   * Initiate OAuth flow and store tokens
   */
  static async connectOneDrive(
    userId: string,
    authCode: string
  ): Promise<OneDriveToken> {
    try {
      const response = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        {
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          code: authCode,
          redirect_uri: process.env.REDIRECT_URI,
          grant_type: 'authorization_code',
          scope: 'Files.Read.All offline_access',
        }
      );

      const token: OneDriveToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
      };

      // TODO: Store token in database with encryption
      return token;
    } catch (error) {
      throw new Error('Failed to connect OneDrive');
    }
  }

  /**
   * Get OneDrive connection status
   */
  static async getConnectionStatus(userId: string): Promise<OneDriveConnectionStatus> {
    try {
      // TODO: Fetch token from database
      // TODO: Validate token and refresh if needed
      return {
        connected: true,
        syncStatus: 'idle',
        lastSyncedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        connected: false,
        syncStatus: 'error',
        lastErrorMessage: 'Failed to fetch connection status',
      };
    }
  }

  /**
   * Trigger manual sync
   */
  static async triggerSync(userId: string, folderId: string): Promise<{ syncId: string }> {
    try {
      // TODO: Queue sync job
      const syncId = `sync-${Date.now()}`;
      return { syncId };
    } catch (error) {
      throw new Error('Failed to trigger sync');
    }
  }

  /**
   * Browse OneDrive folders and files
   */
  static async browseFolders(
    userId: string,
    folderId: string = 'root'
  ): Promise<OneDriveFile[]> {
    try {
      // TODO: Get token from database
      const accessToken = 'mock-token'; // Replace with actual token

      const response = await axios.get(
        `${this.GRAPH_API_BASE}/me/drive/items/${folderId}/children`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.folder ? 'folder' : 'file',
        path: item.parentReference?.path || '/',
        size: item.size,
        modifiedAt: item.lastModifiedDateTime,
      }));
    } catch (error) {
      throw new Error('Failed to browse folders');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(userId: string): Promise<OneDriveToken> {
    try {
      // TODO: Get refresh token from database
      const refreshToken = 'mock-refresh-token';

      const response = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        {
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'Files.Read.All offline_access',
        }
      );

      const token: OneDriveToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + response.data.expires_in * 1000,
      };

      // TODO: Update token in database
      return token;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }
}
