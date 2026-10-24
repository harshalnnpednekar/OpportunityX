import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Compass, Bell, Bookmark, Map, Users, Shield, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar({ onOpenNotifications }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [urgentDeadlineCount, setUrgentDeadlineCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function checkDeadlines() {
      try {
        const data = await api.getTimeline();
        const urgent = (data.timeline?.critical?.length || 0) + (data.timeline?.approaching?.length || 0);
        setUrgentDeadlineCount(urgent);
      } catch (err) {
        // Silently fail if guest or offline
      }
    }

    checkDeadlines();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="container nav-container">
        {/* Brand */}
        <Link to="/" className="nav-brand" aria-label="OpportunityX Home">
          <div className="nav-brand-mark">
            <Compass size={20} strokeWidth={2.5} />
          </div>
          <span>OpportunityX</span>
        </Link>

        {/* Desktop Links */}
        <ul className="nav-links">
          <li>
            <NavLink to="/explore" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Explore Catalogue
            </NavLink>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/roadmaps" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Roadmaps
                </NavLink>
              </li>
              <li>
                <NavLink to="/saved" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Saved
                </NavLink>
              </li>
              <li>
                <NavLink to="/peer-matching" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Peer Matching
                </NavLink>
              </li>
            </>
          )}
          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Shield size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                Admin Data Hub
              </NavLink>
            </li>
          )}
        </ul>

        {/* Right Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <button
                onClick={onOpenNotifications}
                className="nav-notification-btn"
                aria-label={`View deadline notifications (${urgentDeadlineCount} urgent)`}
                title="Upcoming Deadlines"
              >
                <Bell size={18} />
                {urgentDeadlineCount > 0 && (
                  <span className="notification-count-badge">
                    {urgentDeadlineCount}
                  </span>
                )}
              </button>

              <Link to="/profile" className="nav-user-dropdown" title="Edit Profile">
                <User size={15} />
                <span>{user?.profile?.fullName?.split(' ')[0] || 'Student'}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Sign Out"
                aria-label="Sign out of OpportunityX"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Join OpportunityX
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Link to="/explore" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
            Explore Catalogue
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink-primary)' }}>
                Dashboard
              </Link>
              <Link to="/roadmaps" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink-primary)' }}>
                Roadmaps
              </Link>
              <Link to="/saved" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink-primary)' }}>
                Saved Opportunities
              </Link>
              <Link to="/peer-matching" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink-primary)' }}>
                Peer Matching
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--ink-primary)' }}>
                Profile Editor
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-violet-600)', fontWeight: 600 }}>
                  Admin Ingestion Hub
                </Link>
              )}
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }}>
                Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                Log In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
