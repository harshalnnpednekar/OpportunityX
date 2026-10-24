import React from 'react';

export default function OrbitIllustration() {
  return (
    <div className="orbit-visual-card" aria-label="OpportunityX Discovery Path Illustration">
      <div className="orbit-badge-floating">
        System Architecture
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          The Opportunity Discovery Loop
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
          From fragmented raw feeds to submission readiness.
        </p>
      </div>

      <svg
        viewBox="0 0 460 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="orbitStroke" x1="0" y1="0" x2="460" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#0D9488" stopOpacity="0.8" />
            <stop offset="1" stopColor="#4F46E5" stopOpacity="0.9" />
          </linearGradient>
          <filter id="shadowLight" x="-10" y="-10" width="100" height="100" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Orbit Background Path */}
        <path
          d="M 50 150 C 90 40, 200 40, 230 150 C 260 260, 370 260, 410 150"
          stroke="#E5E7EB"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        <path
          d="M 50 150 C 90 40, 200 40, 230 150 C 260 260, 370 260, 410 150"
          stroke="url(#orbitStroke)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Node 1: Ingestion */}
        <g transform="translate(50, 150)">
          <circle r="22" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.5" />
          <circle r="6" fill="#4F46E5" />
          <text x="0" y="38" textAnchor="middle" fill="#111827" fontSize="11" fontWeight="700">1. Feeds</text>
          <text x="0" y="50" textAnchor="middle" fill="#6B7280" fontSize="9">JSON &amp; XML</text>
        </g>

        {/* Node 2: Quality Audit & Deduplication */}
        <g transform="translate(140, 85)">
          <circle r="20" fill="#FFFFFF" stroke="#D97706" strokeWidth="2.5" />
          <circle r="5" fill="#D97706" />
          <text x="0" y="-28" textAnchor="middle" fill="#111827" fontSize="11" fontWeight="700">2. Quality</text>
          <text x="0" y="-16" textAnchor="middle" fill="#6B7280" fontSize="9">Dedupe &amp; Audit</text>
        </g>

        {/* Node 3: Deterministic Scoring (Center Hub) */}
        <g transform="translate(230, 150)">
          <circle r="26" fill="#111827" stroke="#6366F1" strokeWidth="3" />
          <polygon points="230,143 236,155 224,155" fill="#14B8A6" transform="translate(-230, -150)" />
          <circle r="4" fill="#FFFFFF" />
          <text x="0" y="42" textAnchor="middle" fill="#111827" fontSize="12" fontWeight="700">3. Scoring</text>
          <text x="0" y="55" textAnchor="middle" fill="#4F46E5" fontSize="9" fontWeight="600">Explainable</text>
        </g>

        {/* Node 4: Consent Peer Matching */}
        <g transform="translate(320, 215)">
          <circle r="20" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2.5" />
          <circle r="5" fill="#0D9488" />
          <text x="0" y="36" textAnchor="middle" fill="#111827" fontSize="11" fontWeight="700">4. Peers</text>
          <text x="0" y="48" textAnchor="middle" fill="#6B7280" fontSize="9">Opt-in Match</text>
        </g>

        {/* Node 5: Preparation Roadmap */}
        <g transform="translate(410, 150)">
          <circle r="22" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
          <circle r="7" fill="#059669" />
          <text x="0" y="38" textAnchor="middle" fill="#111827" fontSize="11" fontWeight="700">5. Roadmap</text>
          <text x="0" y="50" textAnchor="middle" fill="#6B7280" fontSize="9">4-Phase Sprint</text>
        </g>
      </svg>

      <div style={{
        marginTop: '1.25rem',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-page)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--ink-secondary)'
      }}>
        <span>Strict Eligibility Check</span>
        <strong style={{ color: '#0D9488' }}>100% Deterministic Engine</strong>
      </div>
    </div>
  );
}
