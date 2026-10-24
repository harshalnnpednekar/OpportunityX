import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, CheckSquare, Calendar, Trash2, ArrowRight, CheckCircle2, Clock, Award } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function RoadmapsPage() {
  const { addToast } = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRoadmaps = async () => {
    setLoading(true);
    try {
      const data = await api.getRoadmaps();
      setRoadmaps(data.roadmaps || []);
      if (data.roadmaps && data.roadmaps.length > 0 && !selectedRoadmapId) {
        setSelectedRoadmapId(data.roadmaps[0].id);
      }
    } catch (err) {
      console.error('Failed to load roadmaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const selectedRoadmap = roadmaps.find(r => r.id === selectedRoadmapId) || roadmaps[0];

  const handleToggleTask = async (roadmapId, taskId) => {
    try {
      const res = await api.toggleRoadmapTask(roadmapId, taskId);
      // Update local state
      setRoadmaps(prev => prev.map(rm => {
        if (rm.id !== roadmapId) return rm;
        const updatedTasks = (rm.tasks || []).map(t => {
          if (t.id === taskId) {
            return { ...t, isCompleted: res.task.isCompleted, completedAt: res.task.completedAt };
          }
          return t;
        });
        return {
          ...rm,
          progressPercentage: res.progressPercentage,
          status: res.roadmapStatus,
          tasks: updatedTasks
        };
      }));

      addToast(res.task.isCompleted ? 'Milestone completed!' : 'Milestone reopened', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleDeleteRoadmap = async (roadmapId) => {
    if (!window.confirm('Are you sure you want to delete this preparation roadmap?')) return;
    try {
      await api.deleteRoadmap(roadmapId);
      addToast('Roadmap deleted', 'info');
      setRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
      if (selectedRoadmapId === roadmapId) {
        setSelectedRoadmapId(null);
      }
    } catch (err) {
      addToast('Failed to delete roadmap', 'error');
    }
  };

  // Group tasks by phase for selected roadmap
  const groupedTasks = {};
  if (selectedRoadmap && selectedRoadmap.tasks) {
    selectedRoadmap.tasks.forEach(t => {
      if (!groupedTasks[t.phase]) groupedTasks[t.phase] = [];
      groupedTasks[t.phase].push(t);
    });
  }

  const deadline = selectedRoadmap ? new Date(selectedRoadmap.targetDeadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;

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
            Preparation Roadmaps
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            Structured 4-phase preparation timelines generated from opportunity requirements and deadlines.
          </p>
        </div>

        <Link to="/explore" className="btn btn-primary btn-sm">
          <Compass size={14} />
          <span>Generate New Roadmap</span>
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '80px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      ) : roadmaps.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4.5rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Compass size={40} color="var(--ink-tertiary)" style={{ margin: '0 auto 1rem' }} />
          <h3 className="font-editorial" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            No active roadmaps created yet
          </h3>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            Go to any hackathon, competition, or fellowship in the catalog and click "Generate Preparation Roadmap" to generate tailored milestone checklists.
          </p>
          <Link to="/explore" className="btn btn-secondary btn-sm">
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: roadmaps.length > 1 ? '320px 1fr' : '1fr', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Roadmap Selector Column (if multiple) */}
          {roadmaps.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', marginBottom: '0.25rem' }}>
                Your Roadmaps ({roadmaps.length})
              </div>
              {roadmaps.map(rm => (
                <button
                  key={rm.id}
                  type="button"
                  onClick={() => setSelectedRoadmapId(rm.id)}
                  style={{
                    textAlign: 'left',
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${selectedRoadmapId === rm.id ? 'var(--accent-violet-600)' : 'var(--border-subtle)'}`,
                    backgroundColor: selectedRoadmapId === rm.id ? '#FFFFFF' : 'var(--bg-surface)',
                    boxShadow: selectedRoadmapId === rm.id ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-primary)', marginBottom: '0.35rem' }}>
                    {rm.title.replace(' — Preparation Roadmap', '')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                    <span>{rm.progressPercentage}% done</span>
                    <span style={{ color: rm.status === 'completed' ? '#0D9488' : 'var(--ink-tertiary)' }}>
                      {rm.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Active Roadmap Detail Panel */}
          {selectedRoadmap && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              boxShadow: 'var(--shadow-card)'
            }}>
              {/* Header Box */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <span className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>
                    4-Phase Preparation Sprint
                  </span>
                  <h2 className="font-editorial" style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>
                    {selectedRoadmap.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      Target: {deadline?.toLocaleDateString()}
                    </span>
                    <span style={{ color: daysLeft < 7 ? '#DC2626' : '#0D9488', fontWeight: 600 }}>
                      {daysLeft !== null ? (daysLeft < 0 ? 'Deadline passed' : `${daysLeft} days remaining`) : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedRoadmap.opportunityId && (
                    <Link
                      to={`/opportunities/${selectedRoadmap.opportunityId}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>Opportunity Details</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#DC2626' }}
                    title="Delete roadmap"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Overall Progress Gauge */}
              <div style={{ marginBottom: '2.5rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    Roadmap Readiness Progress
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0D9488', fontFamily: 'var(--font-serif)' }}>
                    {selectedRoadmap.progressPercentage}%
                  </span>
                </div>
                <div className="progress-bar-wrapper" style={{ height: '12px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${selectedRoadmap.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Grouped Phases & Checklist */}
              <div className="roadmap-timeline">
                {Object.entries(groupedTasks).map(([phaseName, phaseTasks]) => {
                  const completedInPhase = phaseTasks.filter(t => t.isCompleted).length;
                  const isPhaseFinished = completedInPhase === phaseTasks.length;

                  return (
                    <div key={phaseName}>
                      <div className="roadmap-phase-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isPhaseFinished && <CheckCircle2 size={18} color="#0D9488" />}
                          {phaseName}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', fontWeight: 500 }}>
                          {completedInPhase} of {phaseTasks.length} milestones
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {phaseTasks.map(task => (
                          <div
                            key={task.id}
                            className={`roadmap-task-row ${task.isCompleted ? 'completed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={task.isCompleted}
                              onChange={() => handleToggleTask(selectedRoadmap.id, task.id)}
                              className="task-checkbox"
                              aria-label={`Mark milestone "${task.title}" as complete`}
                            />

                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: task.isCompleted ? 'var(--ink-tertiary)' : 'var(--ink-primary)',
                                textDecoration: task.isCompleted ? 'line-through' : 'none'
                              }}>
                                {task.title}
                              </div>
                              <p style={{
                                fontSize: '0.85rem',
                                color: task.isCompleted ? 'var(--ink-tertiary)' : 'var(--ink-secondary)',
                                marginTop: '0.2rem'
                              }}>
                                {task.description}
                              </p>
                              {task.dueDate && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Clock size={12} />
                                  <span>Target Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                  {task.completedAt && (
                                    <span style={{ color: '#0D9488', marginLeft: '0.5rem' }}>
                                      ✓ Done {new Date(task.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
