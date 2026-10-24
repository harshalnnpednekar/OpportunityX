import React, { useState } from 'react';
import { Sparkles, HelpCircle, X, CheckCircle2, AlertCircle, ArrowUpRight, BookOpen, Layers } from 'lucide-react';

export default function MatchScoreBadge({
  score = 50,
  matchLevel = 'Good Match',
  formula = '',
  explanation = '',
  reasons = [],
  matchedSkills = [],
  skillGaps = [],
  preparationActions = [],
  matchedInterests = [],
  relevantPreferences = {},
  missingProfileInformation = [],
  missingDataEffect = '',
  componentScores = {}
}) {
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
        title="Click to inspect explainable recommendation breakdown and formula"
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
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-violet" style={{ marginBottom: '0.4rem' }}>
                  Deterministic Scoring Engine
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                  Why This Matches You: {score}% ({matchLevel})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
                  Transparent, verifiable scoring formula. No opaque LLM extrapolation.
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowModal(false)}
                aria-label="Close match explanation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formula & Explanation Callout */}
            {formula && (
              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.825rem'
              }}>
                <div style={{ fontWeight: 600, color: '#4F46E5', marginBottom: '0.25rem' }}>
                  Scoring Formula:
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                  {formula}
                </div>
              </div>
            )}

            {/* Narrative Explanation */}
            {explanation && (
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {explanation}
              </div>
            )}

            {/* Missing Data & Weight Normalization Notice */}
            {missingDataEffect && (
              <div style={{
                padding: '0.75rem 0.9rem',
                backgroundColor: 'rgba(217, 119, 6, 0.06)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--ink-secondary)'
              }}>
                <AlertCircle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#D97706' }}>Missing Data Impact: </strong>
                  {missingDataEffect}
                </div>
              </div>
            )}

            {/* Matched Skills & Skill Gaps with Preparation Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.35rem' }}>
                  Matched Skills ({matchedSkills.length})
                </span>
                {matchedSkills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {matchedSkills.map(skill => (
                      <span key={skill} className="skill-pill matched" style={{ fontSize: '0.75rem' }}>
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.775rem', color: 'var(--ink-tertiary)' }}>No overlapping skills</span>
                )}
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.35rem' }}>
                  Matched Interests
                </span>
                {matchedInterests.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {matchedInterests.map(interest => (
                      <span key={interest} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.775rem', color: 'var(--ink-tertiary)' }}>General alignment</span>
                )}
              </div>
            </div>

            {/* Preparation Actions for Skill Gaps */}
            {preparationActions && preparationActions.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.35rem' }}>
                  Recommended Preparation Actions:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {preparationActions.map((action, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      <BookOpen size={14} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
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
