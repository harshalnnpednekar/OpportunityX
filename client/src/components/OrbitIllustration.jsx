import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, Circle, ArrowRight, Bookmark, MapPin, Calendar, Check, Award } from 'lucide-react';

/**
 * Modern Interactive Opportunity & Match Simulator Card
 * Replaces abstract flowchart graphics with an authentic, interactive product preview.
 */
export default function OrbitIllustration() {
  const [saved, setSaved] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Eligibility check: Undergraduate standing', done: true },
    { id: 2, title: 'Form team: 2-4 members with Python/React', done: true },
    { id: 3, title: 'Prototype sprint: Climate data ingestion MVP', done: false },
    { id: 4, title: 'Final submission: 24h pre-deadline buffer', done: false }
  ]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const completedCount = tasks.filter(t => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '1.75rem',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        position: 'relative'
      }}
      aria-label="Interactive Opportunity Match Preview"
    >
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#4F46E5',
            backgroundColor: '#EEF2FF',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Hackathon
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#0D9488',
            backgroundColor: '#F0FDFA',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px'
          }}>
            Virtual / Global
          </span>
        </div>

        {/* 94% Match Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          <Sparkles size={13} color="#059669" />
          <span>94% Match</span>
        </div>
      </div>

      {/* Title & Host */}
      <div style={{ marginBottom: '1.15rem' }}>
        <h3 style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: '-0.025em',
          marginBottom: '0.35rem',
          lineHeight: 1.3
        }}>
          MIT Climate AI Hackathon 2026
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>MIT Climate Lab &amp; TechX</span>
          <span>•</span>
          <span style={{ color: '#D97706', fontWeight: 600 }}>Closing in 28 days</span>
          <span>•</span>
          <span>$25,000 Prizes</span>
        </p>
      </div>

      {/* Matched Skills Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
          ✓ Python (30%)
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
          ✓ React (25%)
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
          ✓ Sustainability Track (15%)
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0D9488', backgroundColor: '#F0FDFA', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
          Likely Eligible
        </span>
      </div>

      {/* Interactive Preparation Roadmap Simulator */}
      <div style={{
        backgroundColor: '#F8FAFC',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Preparation Roadmap
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5' }}>
            {progressPercent}% Ready
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.85rem' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: '#4F46E5',
            borderRadius: '999px',
            transition: 'width 0.25s ease'
          }} />
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.825rem',
                color: task.done ? '#64748B' : '#0F172A',
                textDecoration: task.done ? 'line-through' : 'none',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {task.done ? (
                <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
              ) : (
                <Circle size={16} color="#CBD5E1" style={{ flexShrink: 0 }} />
              )}
              <span>{task.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link
          to="/explore"
          className="btn btn-primary"
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>Explore Live Catalog</span>
          <ArrowRight size={15} />
        </Link>

        <button
          onClick={() => setSaved(!saved)}
          className="btn btn-secondary"
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            color: saved ? '#4F46E5' : '#475569',
            backgroundColor: saved ? '#EEF2FF' : '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
          title={saved ? 'Opportunity Saved' : 'Save Opportunity'}
        >
          {saved ? <Check size={16} color="#4F46E5" /> : <Bookmark size={16} />}
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
