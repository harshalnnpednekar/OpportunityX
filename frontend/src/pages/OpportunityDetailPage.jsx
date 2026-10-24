import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Globe, Award, MapPin, ExternalLink, Bookmark, CheckCircle2,
  AlertTriangle, ShieldCheck, ArrowLeft, Users, Clock, Compass, Share2
} from 'lucide-react';
import MatchScoreBadge from '../components/MatchScoreBadge';
import EligibilityBadge from '../components/EligibilityBadge';
import OpportunityCard from '../components/OpportunityCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedStatus, setSavedStatus] = useState('saved');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const res = await api.getOpportunity(id);
        setData(res);
        setIsSaved(res.opportunity?.isSaved || false);
        setSavedStatus(res.opportunity?.savedStatus || 'saved');
      } catch (err) {
        console.error('Failed to load opportunity detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const opp = data?.opportunity;
  const related = data?.relatedOpportunities || [];

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      addToast('Sign in to track this opportunity.', 'info');
      navigate('/login');
      return;
    }

    try {
      if (isSaved) {
        await api.removeSaved(opp.id);
        setIsSaved(false);
        addToast('Removed from saved opportunities.', 'info');
      } else {
        await api.saveOpportunity({ opportunityId: opp.id, status: 'saved' });
        setIsSaved(true);
        setSavedStatus('saved');
        addToast('Saved to your tracker!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update saved status', 'error');
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!isAuthenticated) {
      addToast('Sign in to generate tailored preparation roadmaps.', 'info');
      navigate('/login');
      return;
    }

    setGeneratingRoadmap(true);
    try {
      const res = await api.generateRoadmap(opp.id);
      addToast('Preparation roadmap generated!', 'success');
      navigate('/roadmaps');
    } catch (err) {
      addToast(err.message || 'Failed to generate roadmap', 'error');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="skeleton" style={{ height: '36px', width: '30%', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '180px', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2 className="font-editorial" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Opportunity Not Found
        </h2>
        <p style={{ color: 'var(--ink-secondary)', marginBottom: '1.5rem' }}>
          The requested opportunity could not be retrieved from the catalog.
        </p>
        <Link to="/explore" className="btn btn-primary btn-sm">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const deadline = opp.applicationDeadline ? new Date(opp.applicationDeadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isPast = daysLeft !== null && daysLeft < 0;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem' }}>
      {/* Back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
          <ArrowLeft size={15} />
          <span>Back to Catalogue</span>
        </Link>
      </div>

      <div className="detail-layout">
        {/* Main Column */}
        <div className="detail-main">
          {/* Header Card */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                  {opp.opportunityType}
                </span>
                {opp.isDemo && (
                  <span className="badge badge-demo" title="Seeded demonstration record">
                    DEMO LISTING
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                Source: {opp.sourceFeed} ({opp.sourceFormat?.toUpperCase()})
              </span>
            </div>

            <h1 className="font-editorial" style={{ fontSize: '2.25rem', lineHeight: 1.25, marginBottom: '0.5rem' }}>
              {opp.title}
            </h1>

            <div style={{ fontSize: '1rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '1.5rem' }}>
              Organized by {opp.organization}
            </div>

            {/* Score & Eligibility Evaluation Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <MatchScoreBadge
                score={opp.matchScore || 50}
                matchLevel={opp.matchLevel}
                reasons={opp.matchReasons}
                matchedSkills={opp.matchedSkills}
              />
              <EligibilityBadge
                status={opp.eligibilityStatus || 'CONDITIONAL'}
                summary={opp.eligibilitySummary}
                checks={opp.eligibilityChecks}
              />
              <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--ink-tertiary)' }}>
                {daysLeft !== null && (
                  <span style={{ color: isPast ? '#DC2626' : '#0D9488', fontWeight: 600 }}>
                    {isPast ? 'Deadline Closed' : `${daysLeft} days to deadline`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Overview */}
          <section className="detail-meta-box">
            <h3 className="font-editorial" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
              Program Overview
            </h3>
            <p style={{ fontSize: '0.975rem', lineHeight: 1.7, color: 'var(--ink-secondary)', whiteSpace: 'pre-line' }}>
              {opp.description}
            </p>
          </section>

          {/* Strict Eligibility Diagnostics Section */}
          <section className="detail-meta-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 className="font-editorial" style={{ fontSize: '1.35rem' }}>
                Strict Eligibility Diagnostic
              </h3>
              <span className={`badge ${opp.eligibilityStatus === 'ELIGIBLE' ? 'badge-verified' : opp.eligibilityStatus === 'INELIGIBLE' ? 'badge-danger' : 'badge-demo'}`}>
                {opp.eligibilityStatus}
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem' }}>
              {opp.eligibilitySummary || 'Evaluated strictly separate from recommendation relevance.'}
            </p>

            <ul className="criteria-list">
              {(opp.eligibilityChecks || []).map((chk, i) => (
                <li key={i} className={`criteria-item ${chk.status}`}>
                  <div style={{ fontWeight: 600, minWidth: '140px', color: 'var(--ink-primary)' }}>
                    {chk.criterion}
                  </div>
                  <div style={{ flex: 1, color: 'var(--ink-secondary)' }}>
                    {chk.details}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Required Skills & Competencies */}
          <section className="detail-meta-box">
            <h3 className="font-editorial" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
              Target Skills &amp; Core Toolkits
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(opp.requiredSkills || []).map(skill => {
                const isMatched = (opp.matchedSkills || []).includes(skill.toLowerCase());
                return (
                  <span
                    key={skill}
                    className={`skill-pill ${isMatched ? 'matched' : ''}`}
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
                  >
                    {isMatched ? `✓ ${skill} (In your profile)` : skill}
                  </span>
                );
              })}
            </div>
          </section>

          {/* Related Opportunities */}
          {related.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="font-editorial" style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>
                Complementary &amp; Similar Opportunities
              </h3>
              <div className="grid-cards">
                {related.map(rel => (
                  <OpportunityCard key={rel.id} opportunity={rel} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <aside className="detail-sidebar">
          {/* Action Callout */}
          <div className="detail-meta-box" style={{ borderTop: '4px solid var(--accent-violet-600)' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
              Application &amp; Action Hub
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {/* External Application URL */}
              <a
                href={opp.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent"
                style={{ width: '100%' }}
              >
                <span>Official Application Portal</span>
                <ExternalLink size={15} />
              </a>

              {/* Generate Preparation Roadmap Button */}
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={generatingRoadmap}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Compass size={15} />
                <span>{generatingRoadmap ? 'Generating Plan...' : 'Generate Preparation Roadmap'}</span>
              </button>

              {/* Peer Teammate Matching Link */}
              <Link
                to={`/peer-matching?opportunityId=${opp.id}`}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <Users size={15} />
                <span>Find Peer Teammates</span>
              </Link>

              {/* Save / Track Button */}
              <button
                type="button"
                onClick={handleSaveToggle}
                className="btn btn-outline"
                style={{ width: '100%', color: isSaved ? '#0D9488' : 'inherit' }}
              >
                <Bookmark size={15} fill={isSaved ? '#0D9488' : 'none'} />
                <span>{isSaved ? 'Saved to Tracker' : 'Save to Deadline Tracker'}</span>
              </button>
            </div>

            {/* Logistics Breakdown */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: 'var(--ink-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Application Deadline
                  </div>
                  <strong style={{ color: isPast ? '#DC2626' : 'var(--ink-primary)' }}>
                    {deadline ? deadline.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Rolling Admission'}
                  </strong>
                </div>

                <div>
                  <div style={{ color: 'var(--ink-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Delivery Mode
                  </div>
                  <strong>
                    {opp.format === 'virtual' ? '100% Virtual / Remote' :
                     opp.format === 'in_person' ? `In-Person (${opp.location})` :
                     `Hybrid (${opp.location} & Virtual)`}
                  </strong>
                </div>

                <div>
                  <div style={{ color: 'var(--ink-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Prizes &amp; Financial Support
                  </div>
                  <strong>
                    {opp.stipendAmount ? `Living Stipend: ${opp.stipendAmount}` :
                     opp.prizePool ? `Grants: ${opp.prizePool}` :
                     'Educational / Credentialed Program'}
                  </strong>
                </div>

                <div>
                  <div style={{ color: 'var(--ink-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Eligibility Scope
                  </div>
                  <span>
                    {(opp.eligibleEducationLevels || []).join(', ')} • {(opp.eligibleCountries || []).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ethics & Provenance Notice */}
          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--ink-secondary)',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 700, color: 'var(--ink-primary)', marginBottom: '0.35rem' }}>
              Provenance &amp; Simulation Policy
            </div>
            This listing was normalized from source feed <code>{opp.sourceFeed}</code>. Never present seeded examples as live-verified events. OpportunityX does not automatically submit applications or retain user third-party credentials.
          </div>
        </aside>
      </div>
    </div>
  );
}
