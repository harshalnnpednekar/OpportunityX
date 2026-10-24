import React from 'react';
import { Compass } from 'lucide-react';

/**
 * Reusable accessible EmptyState component
 */
export default function EmptyState({
  icon: Icon = Compass,
  title = 'No items found',
  description = 'There are no records matching your criteria at this moment.',
  action = null
}) {
  return (
    <div
      role="status"
      style={{
        textAlign: 'center',
        padding: '4rem 1.5rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        margin: '1.5rem 0'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--ink-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}
      >
        <Icon size={24} />
      </div>

      <h3 className="font-editorial" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p
        style={{
          color: 'var(--ink-secondary)',
          fontSize: '0.9rem',
          maxWidth: '460px',
          margin: '0 auto 1.5rem',
          lineHeight: 1.5
        }}
      >
        {description}
      </p>

      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
