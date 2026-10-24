import React, { useState } from 'react';
import { Sparkles, HelpCircle, X, CheckCircle2 } from 'lucide-react';

export default function MatchScoreBadge({ score = 50, matchLevel = 'Good Match', reasons = [], matchedSkills = [] }) {
  const [showModal, setShowModal] = useState(false);

  let scoreClass = 'score-low';
  if (score >= 80) scoreClass = 'score-high';
  else if (score >= 65) scoreClass = 'score-mid';

  return (
    <>
      <button
        type="button"
        className={`match-score-pill ${scoreClass}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowModal(true);
        }}
        title="Click to inspect explainable recommendation breakdown"
        aria-label={`Match score: ${score} percent. ${matchLevel}. Click for explanation.`}
      >
        <Sparkles size={12} />
        <span>{score}% Match</span>
      </button>

      {showModal && (
        <div
          className="explain-modal-backdrop"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="explain-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>
                  Deterministic Recommendation Engine
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                  Why This Opportunity Matches You ({score}%)
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
                  Transparent point allocation based on your student profile criteria. No opaque AI hallucination.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline btn-sm"
                aria-label="Close match explanation"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Matched skills chips if any */}
            {matchedSkills && matchedSkills.length > 0 && (
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.35rem' }}>
                  Direct Skill Overlap
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {matchedSkills.map(skill => (
                    <span key={skill} className="skill-pill matched">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed reason breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {reasons && reasons.length > 0 ? (
                reasons.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={15} color={r.points > 0 ? '#0D9488' : '#9CA3AF'} />
                      <span style={{ color: 'var(--ink-primary)', fontWeight: 500 }}>{r.label}</span>
                    </div>
                    {r.points !== undefined && (
                      <span style={{ fontWeight: 700, color: r.points > 0 ? '#0D9488' : '#9CA3AF' }}>
                        +{r.points} pts
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-tertiary)' }}>
                  Sign in or complete your skills and interests to see full point breakdown.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowModal(false)}
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
