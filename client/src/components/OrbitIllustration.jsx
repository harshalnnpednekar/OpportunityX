import React from 'react';
import { Compass, Sparkles, Shield, Cpu, Users, Calendar, ArrowRight } from 'lucide-react';

/**
 * Editorial SVG Illustration: Orbital Discovery & Preparation Flow
 * Visualizing the journey from fragmented multi-source feeds to structured execution.
 */
export default function OrbitIllustration() {
  return (
    <div className="orbit-visual-card" aria-label="OpportunityX Discovery Path Illustration">
      <div className="orbit-badge-floating">
        <Sparkles size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
        Discovery Trajectory
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <h4 className="font-editorial" style={{ fontSize: '1.35rem', marginBottom: '0.25rem', color: 'var(--ink-primary)' }}>
          The Opportunity Trajectory
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
          From heterogeneous raw feeds to structured, submission-ready milestone roadmaps.
        </p>
      </div>

      <svg
        viewBox="0 0 520 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbitGrad" x1="40" y1="60" x2="480" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F46E5" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#0D9488" stopOpacity="0.85" />
            <stop offset="1" stopColor="#6366F1" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="centerGlow" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#1E1B4B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>

          <filter id="nodeShadow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="objectBoundingBox">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#111827" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Ambient Orbit Circles */}
        <circle cx="260" cy="160" r="140" stroke="#E7E2D8" strokeWidth="1" strokeDasharray="3 6" opacity="0.6" />
        <circle cx="260" cy="160" r="95" stroke="#E7E2D8" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
        <circle cx="260" cy="160" r="185" stroke="#E7E2D8" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />

        {/* Connecting Trajectory Curves */}
        <path
          d="M 50 160 C 100 70, 190 70, 260 160 C 330 250, 420 250, 470 160"
          stroke="url(#orbitGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="orbit-path-animated"
        />

        {/* Satellite Auxiliary Ray */}
        <line x1="260" y1="160" x2="160" y2="85" stroke="#D5CFBF" strokeWidth="1" strokeDasharray="2 3" />
        <line x1="260" y1="160" x2="360" y2="235" stroke="#D5CFBF" strokeWidth="1" strokeDasharray="2 3" />

        {/* Node 1: Ingestion Sources */}
        <g transform="translate(50, 160)" filter="url(#nodeShadow)">
          <circle r="24" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2.2" />
          <circle r="7" fill="#4F46E5" />
          <text x="0" y="42" textAnchor="middle" fill="var(--ink-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-sans)">1. Ingestion</text>
          <text x="0" y="55" textAnchor="middle" fill="var(--ink-tertiary)" fontSize="9" fontFamily="var(--font-mono)">JSON &amp; XML</text>
        </g>

        {/* Node 2: Data Quality & Deduplication */}
        <g transform="translate(160, 85)" filter="url(#nodeShadow)">
          <circle r="22" fill="#FFFFFF" stroke="#B45309" strokeWidth="2.2" />
          <circle r="6" fill="#B45309" />
          <text x="0" y="-30" textAnchor="middle" fill="var(--ink-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-sans)">2. Audit</text>
          <text x="0" y="-18" textAnchor="middle" fill="var(--ink-tertiary)" fontSize="9" fontFamily="var(--font-mono)">Quality &amp; Dedupe</text>
        </g>

        {/* Node 3: Center Match Engine (Dominant Core) */}
        <g transform="translate(260, 160)" filter="url(#nodeShadow)">
          <circle r="34" fill="url(#centerGlow)" stroke="#4F46E5" strokeWidth="3" />
          {/* Internal Geometric Ring */}
          <circle r="22" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle r="6" fill="#FFFFFF" />
          <text x="0" y="52" textAnchor="middle" fill="var(--ink-primary)" fontSize="12" fontWeight="700" fontFamily="var(--font-sans)">3. Matching Engine</text>
          <text x="0" y="66" textAnchor="middle" fill="#4F46E5" fontSize="9" fontWeight="600" fontFamily="var(--font-mono)">Deterministic Scoring</text>
        </g>

        {/* Node 4: Opt-In Peers */}
        <g transform="translate(360, 235)" filter="url(#nodeShadow)">
          <circle r="22" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2.2" />
          <circle r="6" fill="#0D9488" />
          <text x="0" y="38" textAnchor="middle" fill="var(--ink-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-sans)">4. Peer Match</text>
          <text x="0" y="50" textAnchor="middle" fill="var(--ink-tertiary)" fontSize="9" fontFamily="var(--font-mono)">Consent-Based</text>
        </g>

        {/* Node 5: 4-Phase Roadmap */}
        <g transform="translate(470, 160)" filter="url(#nodeShadow)">
          <circle r="24" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
          <circle r="7" fill="#059669" />
          <text x="0" y="42" textAnchor="middle" fill="var(--ink-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-sans)">5. Roadmap</text>
          <text x="0" y="55" textAnchor="middle" fill="var(--ink-tertiary)" fontSize="9" fontFamily="var(--font-mono)">4-Phase Sprint</text>
        </g>
      </svg>

      {/* Trajectory Footnote */}
      <div style={{
        marginTop: '1.25rem',
        padding: '0.85rem 1rem',
        backgroundColor: 'var(--bg-page)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.825rem',
        color: 'var(--ink-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={14} color="#0D9488" />
          <span>Independent Eligibility Diagnostic</span>
        </div>
        <span style={{ fontWeight: 600, color: '#4F46E5', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          Zero Black-Box Scoring
        </span>
      </div>
    </div>
  );
}
