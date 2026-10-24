import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, AlertTriangle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchTimeline() {
      setLoading(true);
      try {
        const data = await api.getTimeline();
        setTimeline(data.timeline);
      } catch (err) {
        console.error('Failed to load deadline timeline:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeline();
  }, [isOpen]);

  if (!isOpen) return null;

  const critical = timeline?.critical || [];
  const approaching = timeline?.approaching || [];
  const upcoming = timeline?.upcoming || [];
  const later = timeline?.later || [];

  const totalCount = critical.length + approaching.length + upcoming.length + later.length;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Deadline Notifications">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Deadline Timeline
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
              Active countdown alerts for your saved opportunities
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            aria-label="Close notification drawer"
            style={{ padding: '0.35rem 0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <div className="skeleton" style={{ height: '70px' }} />
            <div className="skeleton" style={{ height: '70px' }} />
          </div>
        ) : totalCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-tertiary)' }}>
            <CheckCircle2 size={36} color="#0D9488" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ color: 'var(--ink-primary)', marginBottom: '0.5rem' }}>All Clear</h4>
            <p style={{ fontSize: '0.85rem' }}>
              No upcoming saved deadlines. Save opportunities to your tracker to generate automated timeline reminders.
            </p>
            <Link to="/explore" onClick={onClose} className="btn btn-secondary btn-sm" style={{ marginTop: '1.25rem' }}>
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Critical: <3 days */}
            {critical.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 700, fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={14} />
                  <span>Critical Window (&lt; 3 Days)</span>
                </div>
                {critical.map(item => (
                  <div key={item.savedId} className="timeline-urgent-card timeline-critical">
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <Link to={`/opportunity/${item.opportunityId}`} onClick={onClose} style={{ color: 'inherit' }}>
                        {item.title}
                      </Link>
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      <span>{item.organization}</span>
                      <strong style={{ color: '#DC2626' }}>
                        {item.daysRemaining <= 0 ? 'Today!' : `${item.daysRemaining}d left`}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approaching: 3-7 days */}
            {approaching.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D97706', fontWeight: 700, fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  <Clock size={14} />
                  <span>Approaching (3 - 7 Days)</span>
                </div>
                {approaching.map(item => (
                  <div key={item.savedId} className="timeline-urgent-card timeline-approaching">
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <Link to={`/opportunity/${item.opportunityId}`} onClick={onClose} style={{ color: 'inherit' }}>
                        {item.title}
                      </Link>
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      <span>{item.organization}</span>
                      <strong style={{ color: '#D97706' }}>{item.daysRemaining} days remaining</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming: 7-14 days */}
            {upcoming.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0D9488', fontWeight: 700, fontSize: '0.825rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  <Calendar size={14} />
                  <span>Upcoming (1 - 2 Weeks)</span>
                </div>
                {upcoming.map(item => (
                  <div key={item.savedId} className="timeline-urgent-card timeline-upcoming">
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <Link to={`/opportunity/${item.opportunityId}`} onClick={onClose} style={{ color: 'inherit' }}>
                        {item.title}
                      </Link>
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      <span>{item.organization}</span>
                      <strong style={{ color: '#0D9488' }}>{item.daysRemaining} days remaining</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Later: >14 days */}
            {later.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Future Runway (&gt; 2 Weeks)
                </div>
                {later.map(item => (
                  <div key={item.savedId} style={{ padding: '0.75rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      <Link to={`/opportunity/${item.opportunityId}`} onClick={onClose} style={{ color: 'inherit' }}>
                        {item.title}
                      </Link>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
                      <span>{item.organization}</span>
                      <span>{item.daysRemaining} days left</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Link
            to="/roadmaps"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <span>View All Preparation Roadmaps</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
