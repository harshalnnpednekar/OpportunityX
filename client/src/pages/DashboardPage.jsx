import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Bookmark, Calendar, CheckSquare, Users, Sparkles,
  ArrowRight, ShieldCheck, AlertTriangle, Clock
} from 'lucide-react';
import OpportunityCard from '../components/OpportunityCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const profile = user?.profile;

  const [savedItems, setSavedItems] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [peerMatches, setPeerMatches] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [savedRes, roadmapsRes, timelineRes, recsRes, peerRes] = await Promise.all([
          api.getSaved(),
          api.getRoadmaps(),
          api.getTimeline(),
          api.getRecommendations(4).catch(() => api.getOpportunities({ limit: 4, sort: 'relevance' })),
          api.getMyPeerMatches().catch(() => ({ received: [], sent: [] }))
        ]);

        setSavedItems(savedRes.saved || []);
        setRoadmaps(roadmapsRes.roadmaps || []);
        setTimeline(timelineRes.timeline || null);
        setRecommendations(recsRes.opportunities || []);
        setPeerMatches(peerRes || { received: [], sent: [] });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const urgentCount = (timeline?.critical?.length || 0) + (timeline?.approaching?.length || 0);
  const activeRoadmap = roadmaps.find(r => r.status === 'active') || roadmaps[0];

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem' }}>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <span className="badge badge-violet" style={{ marginBottom: '0.4rem' }}>
            Student Workspace
          </span>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Welcome back, {profile?.fullName || 'Student'}
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            {profile?.university ? `${profile.university} • ${profile.major || 'Computer Science'}` : 'OpportunityX Candidate'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/explore" className="btn btn-primary btn-sm">
            <Compass size={14} />
            <span>Discover Opportunities</span>
          </Link>
          <Link to="/profile" className="btn btn-secondary btn-sm">
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Tracked Opportunities</div>
          <div className="metric-value">{savedItems.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
            Across all pipelines
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Roadmaps</div>
          <div className="metric-value">{roadmaps.filter(r => r.status === 'active').length}</div>
          <div style={{ fontSize: '0.8rem', color: '#0D9488', fontWeight: 600, marginTop: '0.25rem' }}>
            Structured preparation
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Urgent Deadlines (&lt;7d)</div>
          <div className="metric-value" style={{ color: urgentCount > 0 ? '#DC2626' : 'inherit' }}>
            {urgentCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
            Require prompt action
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Peer Collaboration</div>
          <div className="metric-value">
            {profile?.isPublicForMatching ? 'Active' : 'Private'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
            {peerMatches.received.filter(m => m.status === 'pending').length} pending invites
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '2rem', marginBottom: '3.5rem' }}>
        {/* Left Column: Active Roadmaps & Tracking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Roadmap Highlight */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={18} color="#4F46E5" />
                <h3 className="font-editorial" style={{ fontSize: '1.3rem' }}>
                  Preparation Roadmap Progress
                </h3>
              </div>
              <Link to="/roadmaps" className="btn btn-outline btn-sm">
                <span>All Roadmaps</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {activeRoadmap ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {activeRoadmap.title}
                  </h4>
                  <span style={{ fontWeight: 700, color: '#0D9488' }}>
                    {activeRoadmap.progressPercentage}% Complete
                  </span>
                </div>

                <div className="progress-bar-wrapper" style={{ height: '10px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${activeRoadmap.progressPercentage}%` }}
                  />
                </div>

                {/* Next pending task */}
                {activeRoadmap.tasks && activeRoadmap.tasks.find(t => !t.isCompleted) && (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', marginBottom: '0.25rem' }}>
                      Next Recommended Action
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-primary)' }}>
                      {activeRoadmap.tasks.find(t => !t.isCompleted).title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
                      {activeRoadmap.tasks.find(t => !t.isCompleted).description}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--ink-tertiary)' }}>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  No active preparation roadmaps. Open any opportunity in the catalog and click "Generate Preparation Roadmap" to build an actionable timeline.
                </p>
                <Link to="/explore" className="btn btn-secondary btn-sm">
                  Browse Catalog
                </Link>
              </div>
            )}
          </div>

          {/* Top Recommendations Tailored to Student */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="font-editorial" style={{ fontSize: '1.35rem' }}>
                  Recommended For You
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--ink-secondary)' }}>
                  Scored deterministically using your skills: {(profile?.skills || []).slice(0, 4).join(', ')}
                </p>
              </div>
              <Link to="/explore?sort=relevance" className="btn btn-outline btn-sm">
                <span>View All Scored</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {recommendations.slice(0, 2).map(opp => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines & Peer Invites */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Upcoming Deadline Timeline Box */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                Upcoming Deadlines
              </h3>
              <Link to="/saved" style={{ fontSize: '0.825rem', fontWeight: 600 }}>
                Tracker
              </Link>
            </div>

            {urgentCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...(timeline?.critical || []), ...(timeline?.approaching || [])].slice(0, 3).map(item => (
                  <div key={item.savedId} className={`timeline-urgent-card ${item.daysRemaining <= 3 ? 'timeline-critical' : 'timeline-approaching'}`}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      <Link to={`/opportunities/${item.opportunityId}`} style={{ color: 'inherit' }}>
                        {item.title}
                      </Link>
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      <span>{item.organization}</span>
                      <strong>{item.daysRemaining} days left</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ink-tertiary)', fontSize: '0.85rem' }}>
                No urgent deadlines in the next 7 days.
              </div>
            )}
          </div>

          {/* Peer Teammate Requests Card */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={18} color="#0D9488" />
                <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                  Peer Collaboration
                </h3>
              </div>
              <Link to="/peer-matching" style={{ fontSize: '0.825rem', fontWeight: 600 }}>
                Manage
              </Link>
            </div>

            {peerMatches.received.filter(m => m.status === 'pending').length > 0 ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '0.75rem' }}>
                  You have <strong>{peerMatches.received.filter(m => m.status === 'pending').length}</strong> pending collaboration invite(s):
                </p>
                {peerMatches.received.filter(m => m.status === 'pending').slice(0, 2).map(req => (
                  <div key={req.id} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {req.requester?.profile?.fullName || 'A student'} invited you
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--ink-tertiary)' }}>
                      For {req.opportunity?.title}
                    </div>
                  </div>
                ))}
                <Link to="/peer-matching" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Review Collaboration Invites
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                  Connect with peers who complement your tech stack for upcoming hackathons and challenges.
                </p>
                <Link to="/peer-matching" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                  Explore Teammate Matching
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
