import React from 'react';

/**
 * Reusable LoadingSkeleton components
 */
export function CardSkeleton() {
  return (
    <div className="card" style={{ height: '360px' }} aria-busy="true" aria-label="Loading card">
      <div className="skeleton" style={{ height: '22px', width: '35%', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: '28px', marginBottom: '0.75rem' }} />
      <div className="skeleton" style={{ height: '65px', marginBottom: '1.25rem' }} />
      <div className="skeleton" style={{ height: '36px', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: '28px', width: '60%' }} />
    </div>
  );
}

export function PageSkeleton({ count = 6 }) {
  return (
    <div
      className="container"
      style={{ padding: '2.5rem 1rem 5rem' }}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="skeleton" style={{ height: '38px', width: '40%', marginBottom: '0.75rem' }} />
      <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '2.5rem' }} />

      <div className="grid-cards">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default {
  CardSkeleton,
  PageSkeleton
};
