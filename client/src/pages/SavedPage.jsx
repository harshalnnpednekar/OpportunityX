import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, ArrowRight, Trash2, Edit3, Compass, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const PIPELINE_STATUSES = [
  { id: 'all', label: 'All Tracked' },
  { id: 'saved', label: 'Saved (Exploring)' },
  { id: 'planning', label: 'Planning to Apply' },
  { id: 'applied', label: 'Applied' },
  { id: 'accepted', label: 'Accepted / Attending' }
];

export default function SavedPage() {
  const { addToast } = useToast();
  const [savedList, setSavedList] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesText, setNotesText] = useState('');

  const loadSavedOpportunities = async () => {
    setLoading(true);
    try {
      const data = await api.getSaved(activeTab === 'all' ? '' : activeTab);
      setSavedList(data.saved || []);
    } catch (err) {
      console.error('Failed to load saved items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedOpportunities();
  }, [activeTab]);

  const handleStatusChange = async (savedId, newStatus) => {
    try {
      await api.updateSaved(savedId, { status: newStatus });
      addToast(`Status updated to: ${newStatus}`, 'success');
      loadSavedOpportunities();
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleRemove = async (opportunityId) => {
    try {
      await api.removeSaved(opportunityId);
      addToast('Removed from saved opportunities', 'info');
      setSavedList(prev => prev.filter(s => s.opportunityId !== opportunityId));
    } catch (err) {
      addToast('Failed to remove saved opportunity', 'error');
    }
  };

  const handleSaveNotes = async (savedId) => {
    try {
      await api.updateSaved(savedId, { notes: notesText });
      addToast('Notes saved successfully', 'success');
      setEditingNotesId(null);
      loadSavedOpportunities();
    } catch (err) {
      addToast('Failed to save notes', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Saved Opportunities &amp; Pipeline
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            Track application statuses, manage preparation notes, and monitor approaching deadlines.
          </p>
        </div>

        <Link to="/explore" className="btn btn-primary btn-sm">
          <Compass size={14} />
          <span>Discover More Opportunities</span>
        </Link>
      </div>

      {/* Status Pipeline Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {PIPELINE_STATUSES.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`filter-pill-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: '140px' }}>
              <div className="skeleton" style={{ height: '24px', width: '30%', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '40px' }} />
            </div>
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Bookmark size={36} color="var(--ink-tertiary)" style={{ margin: '0 auto 1rem' }} />
          <h3 className="font-editorial" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            No opportunities in this pipeline stage
          </h3>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Browse the catalogue to bookmark interesting hackathons, fellowships, and research positions.
          </p>
          <Link to="/explore" className="btn btn-secondary btn-sm">
            Explore Opportunities
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {savedList.map(item => {
            const opp = item.opportunity;
            if (!opp) return null;

            const deadline = opp.applicationDeadline ? new Date(opp.applicationDeadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const isPast = daysLeft !== null && daysLeft < 0;

            return (
              <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.725rem' }}>
                        {opp.opportunityType}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0' }}>
                      <Link to={`/opportunities/${opp.slug || opp.id}`} style={{ color: 'inherit' }}>
                        {opp.title}
                      </Link>
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-tertiary)' }}>
                      {opp.organization} • {opp.format}
                    </div>
                  </div>

                  {/* Status & Deadline pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isPast ? '#FEF2F2' : '#F0FDFA',
                      border: `1px solid ${isPast ? '#FEE2E2' : '#CCFBF1'}`,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isPast ? '#DC2626' : '#0D9488',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <Calendar size={13} />
                      <span>{isPast ? 'Expired' : `${daysLeft} days left`}</span>
                    </div>

                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="form-select"
                      style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.825rem', fontWeight: 600 }}
                    >
                      <option value="saved">Saved</option>
                      <option value="planning">Planning</option>
                      <option value="applied">Applied</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </div>
                </div>

                {/* Notes Block */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.875rem'
                }}>
                  {editingNotesId === item.id ? (
                    <div>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add preparation notes, team ideas, or deadlines..."
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditingNotesId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveNotes(item.id)}
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <p style={{ color: item.notes ? 'var(--ink-secondary)' : 'var(--ink-tertiary)', fontStyle: item.notes ? 'normal' : 'italic' }}>
                        {item.notes || 'No private notes added yet.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(item.id);
                          setNotesText(item.notes || '');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', flexShrink: 0 }}
                      >
                        <Edit3 size={12} />
                        <span>{item.notes ? 'Edit' : 'Add Note'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link
                      to={`/roadmaps`}
                      className="btn btn-outline btn-sm"
                    >
                      <Compass size={13} />
                      <span>Preparation Roadmaps</span>
                    </Link>
                    <Link
                      to={`/peer-matching?opportunityId=${opp.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      <span>Find Teammates</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(opp.id)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#DC2626' }}
                    title="Remove from tracking"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
