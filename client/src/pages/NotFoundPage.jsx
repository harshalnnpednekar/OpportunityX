import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Search, ArrowRight, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
      <div
        className="card"
        style={{
          maxWidth: '540px',
          width: '100%',
          textAlign: 'center',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 118, 110, 0.1)',
            color: 'var(--accent-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}
        >
          <Compass size={28} />
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ink-tertiary)',
            display: 'block',
            marginBottom: '0.5rem'
          }}
        >
          404 Not Found
        </span>

        <h1 className="font-editorial" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
          This page is beyond our orbit.
        </h1>

        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          The link you followed may be expired, mistyped, or the opportunity has been archived from the active registry.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/explore" className="btn btn-primary btn-sm">
            <Search size={14} />
            <span>Search Catalogue</span>
          </Link>

          <Link to="/" className="btn btn-outline btn-sm">
            <Home size={14} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
