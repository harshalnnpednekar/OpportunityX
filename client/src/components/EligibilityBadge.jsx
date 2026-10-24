import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle, X, Check, XCircle, Info } from 'lucide-react';

export default function EligibilityBadge({ status = 'unknown', summary = '', checks = [] }) {
  const [showModal, setShowModal] = useState(false);

  const normalized = String(status || 'unknown').toLowerCase().trim();

  let badgeClass = 'eligibility-conditional';
  let Icon = HelpCircle;
  let labelText = 'Unknown';
  let pillStyle = { backgroundColor: '#F3F4F6', color: '#4B5563', borderColor: '#E5E7EB' };

  if (normalized === 'eligible') {
    badgeClass = 'eligibility-eligible';
    Icon = ShieldCheck;
    labelText = 'Eligible';
    pillStyle = { backgroundColor: 'rgba(13, 148, 136, 0.1)', color: '#0D9488', borderColor: 'rgba(13, 148, 136, 0.3)' };
  } else if (normalized === 'likely_eligible') {
    badgeClass = 'eligibility-eligible';
    Icon = ShieldCheck;
    labelText = 'Likely Eligible';
    pillStyle = { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)' };
  } else if (normalized === 'needs_review' || normalized === 'conditional') {
    badgeClass = 'eligibility-conditional';
    Icon = AlertTriangle;
    labelText = 'Needs Review';
    pillStyle = { backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', borderColor: 'rgba(217, 119, 6, 0.3)' };
  } else if (normalized === 'not_eligible' || normalized === 'ineligible') {
    badgeClass = 'eligibility-ineligible';
    Icon = ShieldAlert;
    labelText = 'Not Eligible';
    pillStyle = { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.3)' };
  }

  return (
    <>
      <button
        type="button"
        className={`eligibility-pill ${badgeClass}`}
        style={pillStyle}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowModal(true);
        }}
        title="Click to inspect strict eligibility criteria breakdown"
        aria-label={`Eligibility status: ${labelText}. Click for diagnostic.`}
      >
        <Icon size={13} />
        <span>{labelText}</span>
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
                <span className="badge badge-neutral" style={{ marginBottom: '0.5rem' }}>
                  Independent Admission Diagnostic
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                  Eligibility Status: <span style={{ textTransform: 'capitalize' }}>{labelText}</span>
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
                  {summary || 'Evaluated strictly separate from recommendation relevance using explicit criteria.'}
                </p>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.825rem',
              color: 'var(--ink-secondary)',
              marginBottom: '1.25rem'
            }}>
              <strong>Ground Truth Evaluation:</strong> Eligibility is determined solely from explicit organizer requirements and confirmed profile facts. Requirements with missing profile information are marked <em>needs review</em> rather than assuming exclusion or inferring unstated facts.
            </div>

            <div className="criteria-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {checks.map((chk, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    backgroundColor: chk.status === 'pass' ? 'rgba(13, 148, 136, 0.04)' :
                                     chk.status === 'fail' ? 'rgba(220, 38, 38, 0.04)' :
                                     chk.status === 'needs_review' ? 'rgba(217, 119, 6, 0.04)' :
                                     'var(--bg-surface-subtle)'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {chk.status === 'pass' ? (
                      <Check size={16} color="#0D9488" />
                    ) : chk.status === 'fail' ? (
                      <XCircle size={16} color="#DC2626" />
                    ) : chk.status === 'needs_review' ? (
                      <AlertTriangle size={16} color="#D97706" />
                    ) : (
                      <Info size={16} color="#6B7280" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-primary)' }}>
                      {chk.criterion}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--ink-secondary)', marginTop: '0.15rem' }}>
                      {chk.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowModal(false)}
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
