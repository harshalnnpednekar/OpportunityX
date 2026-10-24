import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, X, Check, XCircle } from 'lucide-react';

export default function EligibilityBadge({ status = 'CONDITIONAL', summary = '', checks = [] }) {
  const [showModal, setShowModal] = useState(false);

  let badgeClass = 'eligibility-conditional';
  let Icon = AlertTriangle;
  let labelText = 'Eligibility Check';

  if (status === 'ELIGIBLE') {
    badgeClass = 'eligibility-eligible';
    Icon = ShieldCheck;
    labelText = 'Eligible';
  } else if (status === 'INELIGIBLE') {
    badgeClass = 'eligibility-ineligible';
    Icon = ShieldAlert;
    labelText = 'Ineligible';
  } else {
    labelText = 'Conditional';
  }

  return (
    <>
      <button
        type="button"
        className={`eligibility-pill ${badgeClass}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowModal(true);
        }}
        title="Click to inspect strict eligibility criteria breakdown"
        aria-label={`Eligibility status: ${status}. Click for diagnostic.`}
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
                <span className={`badge ${status === 'ELIGIBLE' ? 'badge-verified' : status === 'INELIGIBLE' ? 'badge-danger' : 'badge-demo'}`} style={{ marginBottom: '0.5rem' }}>
                  Strict Admission Verification
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                  Eligibility Verification: {status}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
                  {summary || 'Automated verification evaluated against your student profile attributes.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline btn-sm"
                aria-label="Close eligibility diagnostic"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {checks && checks.length > 0 ? (
                checks.map((chk, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: chk.status === 'pass' ? '#F0FDFA' : chk.status === 'fail' ? '#FEF2F2' : '#FFFBEB',
                      border: `1px solid ${chk.status === 'pass' ? '#CCFBF1' : chk.status === 'fail' ? '#FEE2E2' : '#FEF3C7'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {chk.status === 'pass' && <Check size={16} color="#0D9488" />}
                      {chk.status === 'fail' && <XCircle size={16} color="#DC2626" />}
                      {chk.status === 'warning' && <AlertTriangle size={16} color="#D97706" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-primary)' }}>
                        {chk.criterion}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
                        {chk.details}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-tertiary)' }}>
                  Log in with your academic profile to evaluate strict criteria.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
