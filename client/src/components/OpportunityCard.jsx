import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Globe, Award, Bookmark, Check, ArrowRight, MapPin } from 'lucide-react';
import MatchScoreBadge from './MatchScoreBadge';
import EligibilityBadge from './EligibilityBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function OpportunityCard({ opportunity, onSavedChange }) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isSaved, setIsSaved] = useState(opportunity.isSaved || false);
  const [savedStatus, setSavedStatus] = useState(opportunity.savedStatus || 'saved');
  const [isSaving, setIsSaving] = useState(false);

  // Compute remaining days to deadline
  const now = new Date();
  const deadline = opportunity.applicationDeadline ? new Date(opportunity.applicationDeadline) : null;
  const daysRemaining = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;
  const isPast = daysRemaining !== null && daysRemaining < 0;

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isAuthenticated) {
      addToast('Please sign in to save opportunities to your tracker.', 'info');
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await api.removeSaved(opportunity.id);
        setIsSaved(false);
        setSavedStatus(null);
        addToast('Removed from saved opportunities.', 'info');
      } else {
        await api.saveOpportunity({ opportunityId: opportunity.id, status: 'saved' });
        setIsSaved(true);
        setSavedStatus('saved');
        addToast('Saved to your opportunity tracker!', 'success');
      }
      if (onSavedChange) onSavedChange(opportunity.id, !isSaved);
    } catch (err) {
      addToast(err.message || 'Failed to update saved status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAuthenticated) return;
    try {
      await api.saveOpportunity({ opportunityId: opportunity.id, status: newStatus });
      setSavedStatus(newStatus);
      setIsSaved(true);
      addToast(`Status updated to: ${newStatus}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  return (
    <article className="opportunity-card" aria-label={opportunity.title}>
      {/* Top Header */}
      <div className="card-top-row">
        <span className="card-category-tag">
          {opportunity.opportunityType}
        </span>
        <div className="card-badges-group">
          {opportunity.isDemo && (
            <span className="badge badge-demo" title="Curated demonstration entry for architectural modeling. Not a live-verified registration portal.">
              DEMO LISTING
            </span>
          )}
          {opportunity.isDuplicate && (
            <span className="badge badge-danger" title="Duplicate fingerprint detected">
              DUPLICATE
            </span>
          )}
        </div>
      </div>

      <span className="card-org">{opportunity.organization}</span>

      <h3 className="card-title">
        <Link to={`/opportunity/${opportunity.slug || opportunity.id}`}>
          {opportunity.title}
        </Link>
      </h3>

      <p className="card-description">
        {opportunity.description}
      </p>

      {/* Match & Eligibility Row */}
      <div className="card-scoring-row">
        <MatchScoreBadge
          score={opportunity.matchScore || opportunity.score || 50}
          matchLevel={opportunity.matchLevel}
          formula={opportunity.formula}
          explanation={opportunity.explanation}
          reasons={opportunity.matchReasons}
          matchedSkills={opportunity.matchedSkills}
          skillGaps={opportunity.skillGaps}
          preparationActions={opportunity.preparationActions}
          matchedInterests={opportunity.matchedInterests}
          relevantPreferences={opportunity.relevantPreferences}
          missingProfileInformation={opportunity.missingProfileInformation}
          missingDataEffect={opportunity.missingDataEffect}
          componentScores={opportunity.componentScores}
        />
        <EligibilityBadge
          status={opportunity.eligibilityStatus || opportunity.eligibility?.status || 'unknown'}
          summary={opportunity.eligibilitySummary || opportunity.eligibility?.summary}
          checks={opportunity.eligibilityChecks || opportunity.eligibility?.checks}
        />
      </div>

      {/* Key Metadata */}
      <div className="card-meta-list">
        <div className="card-meta-item">
          <Globe size={14} color="var(--ink-tertiary)" />
          <span>
            {opportunity.format === 'virtual' ? 'Virtual / Remote' :
             opportunity.format === 'in_person' ? `${opportunity.location || 'In-Person'}` :
             'Hybrid'}
          </span>
        </div>

        <div className="card-meta-item">
          <Calendar size={14} color={isPast ? 'var(--crimson-600)' : 'var(--ink-tertiary)'} />
          <span style={{ color: isPast ? 'var(--crimson-600)' : 'inherit', fontWeight: isPast ? 700 : 500 }}>
            {isPast ? 'Deadline Passed' : daysRemaining !== null ? `${daysRemaining} days left` : 'Rolling'}
          </span>
        </div>

        <div className="card-meta-item">
          <Award size={14} color="var(--ink-tertiary)" />
          <span>
            {opportunity.stipendAmount ? `Stipend: ${opportunity.stipendAmount}` :
             opportunity.prizePool ? `Prizes: ${opportunity.prizePool}` :
             'Certificate & Mentorship'}
          </span>
        </div>

        <div className="card-meta-item">
          <MapPin size={14} color="var(--ink-tertiary)" />
          <span>Level: {opportunity.experienceLevel || 'All Levels'}</span>
        </div>
      </div>

      {/* Required Skills Chips */}
      {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
        <div className="card-skills-row">
          {opportunity.requiredSkills.slice(0, 4).map(skill => {
            const isMatched = (opportunity.matchedSkills || []).includes(skill.toLowerCase());
            return (
              <span key={skill} className={`skill-pill ${isMatched ? 'matched' : ''}`}>
                {skill}
              </span>
            );
          })}
          {opportunity.requiredSkills.length > 4 && (
            <span className="skill-pill">
              +{opportunity.requiredSkills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Card Actions */}
      <div className="card-actions-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`btn btn-sm ${isSaved ? 'btn-secondary' : 'btn-outline'}`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
            style={{ color: isSaved ? '#0D9488' : 'inherit' }}
          >
            <Bookmark size={14} fill={isSaved ? '#0D9488' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {isSaved && (
            <select
              value={savedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                fontSize: '0.775rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)'
              }}
              title="Application status pipeline"
            >
              <option value="saved">Saved</option>
              <option value="planning">Planning</option>
              <option value="applied">Applied</option>
              <option value="accepted">Accepted</option>
            </select>
          )}
        </div>

        <Link
          to={`/opportunity/${opportunity.slug || opportunity.id}`}
          className="btn btn-secondary btn-sm"
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}
