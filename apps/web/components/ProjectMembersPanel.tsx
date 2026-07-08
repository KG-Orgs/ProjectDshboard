'use client';

import type { ProjectMember, ProjectMembersResponse } from '@contractor/shared';
import { FormEvent, useCallback, useEffect, useState } from 'react';

interface ProjectMembersPanelProps {
  projectId: string | null;
}

export default function ProjectMembersPanel({ projectId }: ProjectMembersPanelProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [promoteToOrgAdmin, setPromoteToOrgAdmin] = useState(false);
  const [canPromoteOrgAdmin, setCanPromoteOrgAdmin] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!projectId) {
      setMembers([]);
      setCanManageMembers(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/members`, {
        method: 'GET',
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Unable to load project teammates.');
      }

      const data = (await response.json()) as ProjectMembersResponse;
      setMembers(data.members ?? []);
      setCanManageMembers(Boolean(data.canManageMembers));
      setCanPromoteOrgAdmin(Boolean(data.canPromoteOrgAdmin));
    } catch (loadError) {
      setMembers([]);
      setCanManageMembers(false);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load project teammates.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectId || !inviteEmail.trim()) {
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          projectRole: inviteRole,
          promoteToOrgAdmin: canPromoteOrgAdmin && promoteToOrgAdmin && inviteRole === 'admin',
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Unable to add teammate.');
      }

      setInviteEmail('');
      setInviteRole('member');
      setPromoteToOrgAdmin(false);
      await loadMembers();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to add teammate.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) {
      return;
    }

    setRemovingUserId(userId);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Unable to remove teammate.');
      }

      await loadMembers();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove teammate.');
    } finally {
      setRemovingUserId(null);
    }
  };

  if (!projectId) {
    return null;
  }

  return (
    <div className="dash-card dash-section">
      <div className="dash-card-header">
        <h3 className="dash-section-title" style={{ margin: 0 }}>Project Access</h3>
        {canManageMembers ? (
          <span className="dash-badge dash-badge-success">Admin</span>
        ) : null}
      </div>

      <p className="dash-muted" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
        Teammates with access can open this project in the workspace. They must sign in with Microsoft once before you can add them.
      </p>

      {isLoading ? (
        <p className="dash-muted">Loading teammates...</p>
      ) : members.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: canManageMembers ? '20px' : 0 }}>
          {members.map((member) => (
            <div key={member.userId} className="dash-file-row">
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#475569', flexShrink: 0,
              }}>
                {member.name?.charAt(0)?.toUpperCase() ?? member.email.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="dash-file-name">{member.name || member.email}</p>
                <p className="dash-file-path">{member.email}</p>
              </div>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, flexShrink: 0,
                background: member.projectRole === 'admin' ? '#dbeafe' : '#f1f5f9',
                color: member.projectRole === 'admin' ? '#1d4ed8' : '#64748b',
              }}>
                {member.projectRole}
              </span>
              {canManageMembers ? (
                <button
                  type="button"
                  onClick={() => void handleRemove(member.userId)}
                  disabled={removingUserId === member.userId}
                  className="dash-btn-secondary"
                  style={{
                    fontSize: '12px', padding: '6px 10px',
                    opacity: removingUserId === member.userId ? 0.6 : 1,
                  }}
                >
                  {removingUserId === member.userId ? 'Removing...' : 'Remove'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="dash-muted" style={{ marginBottom: canManageMembers ? '20px' : 0 }}>
          No teammates yet.
        </p>
      )}

      {canManageMembers ? (
        <form onSubmit={(event) => void handleInvite(event)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Add teammate
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="colleague@company.com"
              style={{
                flex: '1 1 220px', padding: '9px 12px', borderRadius: '8px',
                border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', color: '#111827',
                background: '#fff',
              }}
            />
            <select
              value={inviteRole}
              onChange={(event) => {
                const nextRole = event.target.value as 'admin' | 'member';
                setInviteRole(nextRole);
                if (nextRole !== 'admin') {
                  setPromoteToOrgAdmin(false);
                }
              }}
              style={{
                padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb',
                fontSize: '13px', color: '#111827', outline: 'none', background: '#fff',
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            {canPromoteOrgAdmin && inviteRole === 'admin' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={promoteToOrgAdmin}
                  onChange={(event) => setPromoteToOrgAdmin(event.target.checked)}
                />
                Also make org admin (can create projects within their org)
              </label>
            ) : null}
            <button
              type="submit"
              disabled={!inviteEmail.trim() || isInviting}
              className="dash-btn-primary"
              style={{
                opacity: !inviteEmail.trim() || isInviting ? 0.5 : 1,
                cursor: !inviteEmail.trim() || isInviting ? 'not-allowed' : 'pointer',
              }}
            >
              {isInviting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p style={{ fontSize: '12px', color: '#d83b01', marginTop: '12px', lineHeight: 1.5 }}>{error}</p>
      ) : null}
    </div>
  );
}
