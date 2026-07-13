'use client';

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

type LoginPageClientProps = {
  errorMessage: string | null;
};

export default function LoginPageClient({ errorMessage }: LoginPageClientProps) {
  const redirectUri =
    typeof window === 'undefined'
      ? undefined
      : `${window.location.origin}/auth/callback`;
  const authUrl = redirectUri
    ? `/api/auth/login?redirectUri=${encodeURIComponent(redirectUri)}&prompt=select_account`
    : '/api/auth/login';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0078d4 0%, #004f9e 60%, #003370 100%)',
        padding: '24px',
        fontFamily: "'Segoe UI', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          width: '100%',
          maxWidth: '420px',
          padding: '48px 44px 40px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#0078d4',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,120,212,0.35)',
              fontSize: '32px',
            }}
          >
            🏗️
          </div>
          <h1
            style={{
              margin: '0 0 10px',
              fontSize: '26px',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.5px',
            }}
          >
            ContractorAI
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '300px',
            }}
          >
            Connect your project documents and ask questions with cited answers.
          </p>
        </div>

        {errorMessage ? (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#b91c1c',
              lineHeight: '1.5',
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <a
          href={authUrl}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            background: '#0078d4',
            color: '#fff',
            fontWeight: 600,
            fontSize: '15px',
            padding: '14px 20px',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'background 0.15s',
            boxShadow: '0 2px 8px rgba(0,120,212,0.30)',
          }}
          onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#005a9e'; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#0078d4'; }}
        >
          <MicrosoftLogo />
          Continue with Microsoft
        </a>

        <p
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca3af',
            lineHeight: '1.5',
          }}
        >
          Secure sign-in using your Microsoft account.
        </p>
      </div>
    </div>
  );
}
