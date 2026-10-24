import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, LogIn, Sparkles, Shield, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login, sessionExpired } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectPath = location.state?.from?.pathname || '/dashboard';
  const isSessionExpired = sessionExpired || location.state?.sessionExpired;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      addToast('Welcome back to OpportunityX!', 'success');
      if (loggedInUser?.role === 'admin' && (!location.state?.from || location.state?.from?.pathname === '/dashboard')) {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem 6rem', maxWidth: '480px' }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--ink-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Compass size={22} />
          </div>
          <h2 className="font-editorial" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Sign In to OpportunityX
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
            Access personalized recommendations, deadline trackers, and roadmaps
          </p>
        </div>

        {/* Demo Account Quick-Fill Card */}
        <div style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-violet-700)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            <Sparkles size={13} />
            <span>Demonstration Quick-Fill</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoFill('alex.chen@university.edu', 'StudentPass123!')}
              style={{ flex: 1, fontSize: '0.775rem' }}
            >
              <User size={13} />
              <span>Demo Student</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoFill('admin@opportunityx.edu', 'AdminPass123!')}
              style={{ flex: 1, fontSize: '0.775rem' }}
            >
              <Shield size={13} />
              <span>Curator Admin</span>
            </button>
          </div>
        </div>

        {/* Session Expired Notice */}
        {isSessionExpired && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFBEB',
            color: '#B45309',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>Your session has expired. Please sign in again to continue.</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FEE2E2',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.chen@university.edu"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            <LogIn size={15} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Create Student Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
