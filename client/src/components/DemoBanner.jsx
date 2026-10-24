import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside className="demo-banner" role="alert" aria-label="Demonstration Notice">
      <AlertCircle size={15} style={{ flexShrink: 0 }} />
      <span>
        <strong>DEMONSTRATION CATALOG:</strong> Opportunities are curated simulated entries for discovery modeling and architectural testing. Never present seeded examples as live-verified events.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss demo alert"
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: '#78350F',
          cursor: 'pointer',
          padding: '2px'
        }}
      >
        <X size={14} />
      </button>
    </aside>
  );
}
