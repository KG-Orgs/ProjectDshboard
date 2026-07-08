'use client';

import type {
  AddPlatformOrgUserRequest,
  AuthMeResponse,
  PlatformOrganization,
  PlatformOrgUser,
  UserRole,
} from '@contractor/shared';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';

export default function PlatformAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [orgUsers, setOrgUsers] = useState<PlatformOrgUser[]>([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadOrganizations = useCallback(async () => {
    const response = await fetch('/api/platform/organizations', { method: 'GET' });
    if (!response.ok) {
      throw new Error('Unable to load organizations.');
    }
    const data = (await response.json()) as { organizations: PlatformOrganization[] };
    setOrganizations(data.organizations ?? []);
    setSelectedOrgId((current) => current || data.organizations?.[0]?.id || '');
  }, []);

  const loadOrgUsers = useCallback(async (orgId: string) => {
    if (!orgId) {
      setOrgUsers([]);
      return;
    }

    const response = await fetch(`/api/platform/organizations/${encodeURIComponent(orgId)}/users`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Unable to load organization users.');
    }
    const data = (await response.json()) as { users: PlatformOrgUser[] };
    setOrgUsers(data.users ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const meResponse = await fetch('/api/auth/me', { method: 'GET' });
        if (!meResponse.ok) {
          setAuthorized(false);
          return;
        }

        const me = (await meResponse.json()) as AuthMeResponse;
        const isOperator = Boolean(me.capabilities?.isPlatformOperator);
        setAuthorized(isOperator);
        if (!isOperator) {
          return;
        }

        await loadOrganizations();
      } catch (loadError) {
        setAuthorized(false);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load admin console.');
      }
    })();
  }, [loadOrganizations]);

  useEffect(() => {
    if (!selectedOrgId || authorized !== true) {
      return;
    }
    void loadOrgUsers(selectedOrgId).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
    });
  }, [authorized, loadOrgUsers, selectedOrgId]);

  const handleCreateOrg = async (event: FormEvent) => {
    event.preventDefault();
    if (!newOrgName.trim()) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/platform/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Failed to create organization.');
      }

      setNewOrgName('');
      setStatusMessage('Organization created.');
      await loadOrganizations();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create organization.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleInviteUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedOrgId || !inviteEmail.trim()) {
      return;
    }

    setIsBusy(true);
    setError(null);
    setStatusMessage(null);

    const payload: AddPlatformOrgUserRequest = {
      email: inviteEmail.trim(),
      name: inviteName.trim() || undefined,
      role: inviteRole,
    };

    try {
      const response = await fetch(
        `/api/platform/organizations/${encodeURIComponent(selectedOrgId)}/users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Failed to add user.');
      }

      setInviteEmail('');
      setInviteName('');
      setInviteRole('member');
      setStatusMessage('User invited. They can sign in with Microsoft after you add them.');
      await loadOrgUsers(selectedOrgId);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Failed to add user.');
    } finally {
      setIsBusy(false);
    }
  };

  if (authorized === null) {
    return (
      <main style={{ maxWidth: '720px', margin: '48px auto', padding: '0 24px', color: '#64748b' }}>
        Loading platform console...
      </main>
    );
  }

  if (!authorized) {
    return (
      <main style={{ maxWidth: '720px', margin: '48px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Access denied</h1>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          This console is only available to platform operators.
        </p>
        <Link href="/" style={{ color: '#0078d4', fontWeight: 600, textDecoration: 'none' }}>
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '920px', margin: '32px auto', padding: '0 24px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Platform Admin</h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Create organizations and invite users before they sign in.
          </p>
        </div>
        <Link href="/" style={{ color: '#0078d4', fontWeight: 600, textDecoration: 'none' }}>
          Dashboard
        </Link>
      </div>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Create organization</h2>
        <form onSubmit={(event) => void handleCreateOrg(event)} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            value={newOrgName}
            onChange={(event) => setNewOrgName(event.target.value)}
            placeholder="Acme Construction"
            style={{ flex: '1 1 240px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <button
            type="submit"
            disabled={isBusy || !newOrgName.trim()}
            style={{ background: '#0078d4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600 }}
          >
            Create
          </button>
        </form>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Organization users</h2>

        <select
          value={selectedOrgId}
          onChange={(event) => setSelectedOrgId(event.target.value)}
          style={{ width: '100%', marginBottom: '16px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
        >
          <option value="">Select organization...</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>

        {orgUsers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {orgUsers.map((orgUser) => (
              <div key={orgUser.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{orgUser.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{orgUser.email}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8' }}>{orgUser.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', marginBottom: '20px' }}>No users in this organization yet.</p>
        )}

        <form onSubmit={(event) => void handleInviteUser(event)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="user@company.com"
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <input
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
            placeholder="Display name (optional)"
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as UserRole)}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          >
            <option value="member">Member</option>
            <option value="pm">Project manager</option>
            <option value="admin">Org admin</option>
            <option value="super">Org super</option>
          </select>
          <button
            type="submit"
            disabled={isBusy || !selectedOrgId || !inviteEmail.trim()}
            style={{ alignSelf: 'flex-start', background: '#0078d4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600 }}
          >
            Add user to organization
          </button>
        </form>
      </section>

      {statusMessage ? (
        <p style={{ marginTop: '16px', color: '#166534', fontSize: '14px' }}>{statusMessage}</p>
      ) : null}
      {error ? (
        <p style={{ marginTop: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</p>
      ) : null}
    </main>
  );
}
