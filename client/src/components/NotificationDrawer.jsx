import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, AlertTriangle, Clock, ArrowRight, CheckCircle2, Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function NotificationDrawer({ isOpen, onClose, onNotificationCountChange }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'deadlines'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDrawerData = async () => {
    setLoading(true);
    try {
      const [notifsRes, timelineRes] = await Promise.all([
        api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        api.getTimeline().catch(() => ({ timeline: null }))
      ]);

      setNotifications(notifsRes.notifications || []);
      const count = notifsRes.unreadCount ?? (notifsRes.notifications || []).filter(n => !n.readAt).length;
      setUnreadCount(count);
      if (onNotificationCountChange) {
        onNotificationCountChange(count);
      }
      setTimeline(timelineRes.timeline || null);
    } catch (err) {
      console.error('Failed to load notification drawer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrawerData();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    setActionLoading(true);
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (onNotificationCountChange) {
        onNotificationCountChange(Math.max(0, unreadCount - 1));
      }
      addToast('Marked notification as read', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to update notification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.readAt);
    if (unread.length === 0) return;

    setActionLoading(true);
    try {
      await Promise.all(unread.map(n => api.markNotificationRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      if (onNotificationCountChange) {
        onNotificationCountChange(0);
      }
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to mark all notifications as read', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const critical = timeline?.critical || [];
  const approaching = timeline?.approaching || [];
  const upcoming = timeline?.upcoming || [];
  const later = timeline?.later || [];

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications and Deadlines"
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Activity &amp; Deadlines
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', margin: '0.2rem 0 0' }}>
              System notifications and saved opportunity countdowns
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            aria-label="Close drawer"
            style={{ padding: '0.35rem 0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={13} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: activeTab === 'notifications' ? '#FFFFFF' : 'var(--accent-teal)',
                color: activeTab === 'notifications' ? 'var(--accent-teal)' : '#FFFFFF',
                borderRadius: '10px',
                padding: '0.1rem 0.45rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                marginLeft: '0.2rem'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'deadlines' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={() => setActiveTab('deadlines')}
          >
            <Clock size={13} />
            <span>Deadline Timelines</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '2rem 1rem' }}>
            <div className="skeleton" style={{ height: '56px', marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ height: '56px', marginBottom: '0.75rem' }} />
            <div className="skeleton" style={{ height: '56px' }} />
          </div>
        ) : activeTab === 'notifications' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', fontWeight: 600 }}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-teal)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <CheckCheck size={14} />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-tertiary)' }}>
                <CheckCircle2 size={36} color="var(--accent-teal)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '0.25rem' }}>No new notifications</p>
                <p style={{ fontSize: '0.8rem' }}>Updates on your tracked deadlines and peer requests will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notifications.map((notif) => {
                  const isUnread = !notif.readAt;
                  return (
                    <div
                      key={notif.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isUnread ? 'rgba(15, 118, 110, 0.05)' : 'var(--bg-canvas)',
                        border: isUnread ? '1px solid rgba(15, 118, 110, 0.25)' : '1px solid var(--border-subtle)',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: isUnread ? 'var(--accent-teal)' : 'var(--ink-tertiary)'
                        }}>
                          {notif.type?.replace(/_/g, ' ') || 'Notification'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-primary)', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {notif.opportunityId ? (
                          <Link
                            to={`/opportunities/${notif.opportunityId}`}
                            onClick={onClose}
                            style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <span>View Opportunity</span>
                            <ArrowRight size={12} />
                          </Link>
                        ) : <div />}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notif.id)}
                            disabled={actionLoading}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.7rem',
                              color: 'var(--ink-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Deadlines Tab */
          <div>
            {critical.length === 0 && approaching.length === 0 && upcoming.length === 0 && later.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--ink-tertiary)' }}>
                <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '0.25rem' }}>No active deadline alerts</p>
                <p style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>Save opportunities to your tracker to generate automated countdown timelines.</p>
                <Link to="/explore" onClick={onClose} className="btn btn-outline btn-sm">
                  Browse Opportunities
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {critical.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-danger)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={14} />
                      <span>Critical (Under 7 Days)</span>
                    </h4>
                    {critical.map(item => (
                      <div key={item.id} className="timeline-item" style={{ borderLeft: '3px solid var(--accent-danger)', padding: '0.65rem 0.85rem', marginBottom: '0.5rem', backgroundColor: 'rgba(185, 28, 28, 0.04)', borderRadius: '4px' }}>
                        <Link to={`/opportunities/${item.opportunityId}`} onClick={onClose} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-primary)', display: 'block', marginBottom: '0.2rem' }}>
                          {item.title}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                          Deadline: {item.daysRemaining} days remaining ({new Date(item.deadline).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {approaching.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} />
                      <span>Approaching (7–14 Days)</span>
                    </h4>
                    {approaching.map(item => (
                      <div key={item.id} className="timeline-item" style={{ borderLeft: '3px solid var(--accent-amber)', padding: '0.65rem 0.85rem', marginBottom: '0.5rem', backgroundColor: 'rgba(180, 83, 9, 0.04)', borderRadius: '4px' }}>
                        <Link to={`/opportunities/${item.opportunityId}`} onClick={onClose} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-primary)', display: 'block', marginBottom: '0.2rem' }}>
                          {item.title}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                          Deadline: {item.daysRemaining} days remaining ({new Date(item.deadline).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Upcoming (14–30 Days)
                    </h4>
                    {upcoming.map(item => (
                      <div key={item.id} className="timeline-item" style={{ borderLeft: '3px solid var(--accent-teal)', padding: '0.65rem 0.85rem', marginBottom: '0.5rem', backgroundColor: 'rgba(15, 118, 110, 0.04)', borderRadius: '4px' }}>
                        <Link to={`/opportunities/${item.opportunityId}`} onClick={onClose} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-primary)', display: 'block', marginBottom: '0.2rem' }}>
                          {item.title}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                          {item.daysRemaining} days remaining ({new Date(item.deadline).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
