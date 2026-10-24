import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Compass, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDeniedPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="container" style={{ padding: '6rem 1rem 8rem', maxWidth: '640px', textAlign: 'center' }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '3.5rem 2rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.75rem'
        }}>
          <ShieldAlert size={36} strokeWidth={2} />
        </div>

        <span className="badge badge-curator" style={{ marginBottom: '1rem', display: 'inline-block', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#DC2626' }}>
          403 Forbidden
        </span>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Access Restricted
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          This administrative resource is protected by server-enforced Role-Based Access Control (RBAC). 
          Your account ({user?.email || 'Guest'}, Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role || 'Unauthenticated'}</strong>) 
          does not possess administrative curator privileges.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={16} />
              Return to Student Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Sign In to Your Account
            </Link>
          )}

          <Link to="/explore" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={16} />
            Explore Public Opportunities
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
