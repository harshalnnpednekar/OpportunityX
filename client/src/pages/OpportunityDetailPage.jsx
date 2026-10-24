import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Globe, Award, MapPin, ExternalLink, Bookmark, CheckCircle2,
  AlertTriangle, ShieldCheck, ArrowLeft, Users, Clock, Compass, Share2, Check,
  Info, Sparkles, Layers, DollarSign, UserCheck, ShieldAlert, Edit3, Trash2, X
} from 'lucide-react';
import MatchScoreBadge from '../components/MatchScoreBadge';
import EligibilityBadge from '../components/EligibilityBadge';
import OpportunityCard from '../components/OpportunityCard';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedStatus, setSavedStatus] = useState('saved');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

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
  const trust = opp?.trustSignal;

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

  const handleStatusChange = async (newStatus) => {
    if (!isAuthenticated) return;
    try {
      await api.saveOpportunity({ opportunityId: opp.id, status: newStatus });
      setSavedStatus(newStatus);
      setIsSaved(true);
      addToast(`Status updated to: ${newStatus}`, 'success');
    } catch (err) {
      addToast('Failed to update status', 'error');
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
      await api.generateRoadmap(opp.id);
      addToast('Preparation roadmap generated successfully!', 'success');
      navigate('/roadmaps');
    } catch (err) {
      addToast(err.message || 'Failed to generate roadmap', 'error');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleStartEdit = () => {
    setEditFormData({
      title: opp.title || '',
      organization: opp.organization || opp.organizer || '',
      description: opp.description || '',
      category: opp.category || 'general',
      eventType: opp.eventType || 'hackathon',
      format: opp.deliveryFormat || opp.format || 'virtual',
      location: opp.location || 'Online',
      applicationDeadline: opp.applicationDeadline ? opp.applicationDeadline.split('T')[0] : '',
      costAmount: opp.costAmount || 0,
      status: opp.status || 'active'
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateOpportunity(opp.id, editFormData);
      setData(prev => ({
        ...prev,
        opportunity: { ...prev.opportunity, ...res.opportunity }
      }));
      setIsEditing(false);
      addToast('Opportunity updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update opportunity', 'error');
    }
  };

  const handleDeleteOpportunity = async () => {
    if (!window.confirm(`Are you sure you want to delete "${opp.title}"? This action cannot be undone.`)) return;
    try {
      await api.deleteOpportunity(opp.id);
      addToast('Opportunity deleted successfully.', 'info');
      navigate('/explore');
    } catch (err) {
      addToast(err.message || 'Failed to delete opportunity', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }} aria-busy="true" aria-label="Loading opportunity details">
        <div className="skeleton" style={{ height: '36px', width: '30%', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '220px', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '340px' }} />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2 className="font-editorial" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Opportunity Not Found
        </h2>
        <p style={{ color: 'var(--ink-secondary)', marginBottom: '1.5rem' }}>
          The requested listing could not be retrieved or has been archived from the active registry.
        </p>
        <Link to="/explore" className="btn btn-primary btn-sm">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const deadline = opp.applicationDeadline || opp.deadline ? new Date(opp.applicationDeadline || opp.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isPast = daysLeft !== null && daysLeft < 0;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem' }}>
      {/* Back to Catalogue */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
          <ArrowLeft size={15} />
          <span>Back to Catalogue</span>
        </Link>
      </div>

      <div className="detail-layout">
        {/* Main Column */}
        <div className="detail-main">
          {/* Header Card prioritizing Deadline & Direct Portal Access */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.25rem',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="card-category-tag" style={{ fontSize: '0.8rem' }}>
                  {opp.opportunityType || opp.category}
                </span>
                {opp.verified && (
                  <span className="badge badge-verified" style={{ fontSize: '0.75rem' }}>
                    Verified Host
                  </span>
                )}
                {opp.status === 'expired' && (
                  <span className="badge badge-danger">
                    EXPIRED
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
                Source: {opp.sourceFeed || opp.sourceName || 'Registry'}
              </span>
            </div>

            <h1 className="font-editorial" style={{ fontSize: '2.35rem', lineHeight: 1.25, marginBottom: '0.5rem', color: 'var(--ink-primary)' }}>
              {opp.title}
            </h1>

            <div style={{ fontSize: '1.05rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '1.75rem' }}>
              Organized by {opp.organization || opp.organizer}
            </div>

            {/* Prominent Deadline & Direct Action Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-page)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.2rem' }}>
                  Application Deadline
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--ink-primary)" />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {deadline ? deadline.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Rolling Admissions'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {daysLeft !== null && (
                  <span style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: isPast ? 'rgba(185, 28, 28, 0.1)' : daysLeft <= 7 ? 'rgba(180, 83, 9, 0.1)' : 'rgba(15, 118, 110, 0.1)',
                    color: isPast ? 'var(--accent-danger)' : daysLeft <= 7 ? 'var(--accent-amber)' : 'var(--accent-teal)'
                  }}>
                    {isPast ? 'Deadline Closed' : `${daysLeft} days remaining`}
                  </span>
                )}

                {opp.applicationUrl && (
                  <a
                    href={opp.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <span>Official Portal</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Key Metadata Badges */}
            <div className="card-footer-info" style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="card-meta-item">
                <Globe size={14} />
                <span>Format: <strong>{opp.deliveryFormat || opp.format || 'Virtual'}</strong></span>
              </div>
              <div className="card-meta-item">
                <MapPin size={14} />
                <span>Location: <strong>{opp.location || 'Global'}</strong></span>
              </div>
              <div className="card-meta-item">
                <DollarSign size={14} />
                <span>Cost: <strong>{opp.costAmount ? `$${opp.costAmount}` : 'Free'}</strong></span>
              </div>
              {opp.teamMin && (
                <div className="card-meta-item">
                  <Users size={14} />
                  <span>Team: <strong>{opp.teamMin}–{opp.teamMax || '+'} members</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* 1. Strict Eligibility Diagnostic Section */}
          <section className="detail-meta-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="font-editorial" style={{ fontSize: '1.35rem', color: 'var(--ink-primary)', marginBottom: '0.2rem' }}>
                  Independent Eligibility Diagnostic
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                  Evaluated strictly separate from recommendation relevance. Zero inferred assumptions.
                </span>
              </div>
              <EligibilityBadge
                status={opp.eligibilityStatus || opp.eligibility?.status || 'unknown'}
                summary={opp.eligibilitySummary || opp.eligibility?.summary}
                checks={opp.eligibilityChecks || opp.eligibility?.checks}
              />
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {opp.eligibilitySummary || opp.eligibility?.summary || 'Evaluated against verified criteria from your student profile.'}
            </p>

            <ul className="criteria-list">
              {(opp.eligibilityChecks || opp.eligibility?.checks || []).map((chk, i) => (
                <li key={i} className={`criteria-item ${chk.status}`}>
                  <div style={{ fontWeight: 600, minWidth: '150px', color: 'var(--ink-primary)' }}>
                    {chk.criterion}
                  </div>
                  <div style={{ flex: 1, color: 'var(--ink-secondary)', fontSize: '0.875rem' }}>
                    {chk.details}
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: chk.status === 'passed' ? 'var(--accent-teal)' : chk.status === 'failed' ? 'var(--accent-danger)' : 'var(--accent-amber)'
                  }}>
                    {chk.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 2. Deterministic Recommendation & Match Explanation */}
          <section className="detail-meta-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 className="font-editorial" style={{ fontSize: '1.35rem', color: 'var(--ink-primary)', marginBottom: '0.2rem' }}>
                  Deterministic Match Explanation
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                  Multi-factor point allocation with dynamic weight re-normalization.
                </span>
              </div>
              <MatchScoreBadge
                score={opp.matchScore || opp.score || 50}
                matchLevel={opp.matchLevel}
                formula={opp.formula}
                explanation={opp.explanation}
                reasons={opp.matchReasons}
                matchedSkills={opp.matchedSkills}
                skillGaps={opp.skillGaps}
                preparationActions={opp.preparationActions}
                matchedInterests={opp.matchedInterests}
                relevantPreferences={opp.relevantPreferences}
                missingProfileInformation={opp.missingProfileInformation}
                missingDataEffect={opp.missingDataEffect}
                componentScores={opp.componentScores}
              />
            </div>

            {opp.formula && (
              <div style={{
                backgroundColor: 'var(--bg-page)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--ink-primary)',
                marginBottom: '1rem',
                overflowX: 'auto'
              }}>
                <strong>Formula:</strong> {opp.formula}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {opp.explanation || 'Calculated using configured weights: Skill overlap (30%), Interest/category (25%), Format/availability (15%), Budget (15%), Experience level (10%), Sustainability (5%).'}
            </p>

            {/* Matched Skills vs Suggested Gaps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-teal)', marginBottom: '0.5rem' }}>
                  ✓ Matched Competencies
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(opp.matchedSkills && opp.matchedSkills.length > 0) ? opp.matchedSkills.map(s => (
                    <span key={s} className="skill-pill matched">{s}</span>
                  )) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>No direct skill overlaps detected.</span>
                  )}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>
                  Suggested Preparation Runway
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(opp.skillGaps && opp.skillGaps.length > 0) ? opp.skillGaps.map(g => (
                    <span key={g} className="skill-pill" style={{ borderColor: 'rgba(180, 83, 9, 0.3)' }}>{g}</span>
                  )) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>Prerequisites satisfied.</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Program Overview & Details */}
          <section className="detail-meta-box">
            <h3 className="font-editorial" style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--ink-primary)' }}>
              Program Overview &amp; Curriculum
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--ink-secondary)', whiteSpace: 'pre-line' }}>
              {opp.description}
            </p>
          </section>

          {/* Related Opportunities */}
          {related.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 className="font-editorial" style={{ fontSize: '1.35rem', marginBottom: '1.25rem', color: 'var(--ink-primary)' }}>
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
          {/* Action Hub */}
          <div className="detail-meta-box" style={{ borderTop: '4px solid var(--accent-violet-600)' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--ink-primary)' }}>
              Action Hub
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {/* External Portal */}
              {opp.applicationUrl && (
                <a
                  href={opp.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span>Official Application Portal</span>
                  <ExternalLink size={15} />
                </a>
              )}

              {/* Save to Tracker */}
              <button
                type="button"
                onClick={handleSaveToggle}
                className={`btn ${isSaved ? 'btn-secondary' : 'btn-outline'}`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isSaved ? <Check size={15} color="var(--accent-teal)" /> : <Bookmark size={15} />}
                <span>{isSaved ? 'Saved to Tracker' : 'Save to Pipeline'}</span>
              </button>

              {isSaved && (
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label htmlFor="pipelineStatus" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.25rem' }}>
                    Pipeline Stage:
                  </label>
                  <select
                    id="pipelineStatus"
                    value={savedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
                  >
                    <option value="saved">Saved (Exploring)</option>
                    <option value="planning">Planning to Apply</option>
                    <option value="applied">Applied (Submitted)</option>
                    <option value="accepted">Accepted / Attending</option>
                  </select>
                </div>
              )}

              {/* Generate Preparation Roadmap */}
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={generatingRoadmap}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Compass size={15} />
                <span>{generatingRoadmap ? 'Generating Sprint Plan...' : 'Generate 4-Phase Roadmap'}</span>
              </button>

              {/* Teammate Matching */}
              <Link
                to={`/peers?opportunityId=${opp.id}`}
                className="btn btn-outline"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Users size={15} />
                <span>Find Teammates</span>
              </Link>
            </div>
          </div>

          {/* Admin Management Card (Authorized Admins Only) */}
          {user?.role === 'admin' && (
            <div className="detail-meta-box" style={{ border: '1px solid rgba(220, 38, 38, 0.3)', backgroundColor: 'rgba(220, 38, 38, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldAlert size={18} color="#DC2626" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#DC2626' }}>
                    Curator Controls
                  </h4>
                </div>
                <span className="badge badge-danger">Admin Only</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                Manage or retire this shared opportunity across the OpportunityX global registry.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Edit3 size={14} />
                  <span>Edit Opportunity Listing</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOpportunity}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#DC2626', borderColor: '#DC2626' }}
                >
                  <Trash2 size={14} />
                  <span>Delete Opportunity</span>
                </button>
              </div>
            </div>
          )}

          {/* Data Quality & Trust Signal Card */}
          <div className="detail-meta-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={18} color="var(--accent-teal)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Data Quality Signal
                </h4>
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: (trust?.trustScore ?? 80) >= 70 ? 'rgba(15, 118, 110, 0.1)' : 'rgba(180, 83, 9, 0.1)',
                color: (trust?.trustScore ?? 80) >= 70 ? 'var(--accent-teal)' : 'var(--accent-amber)'
              }}>
                {trust?.trustScore ?? opp.trustScore ?? 80}/100
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
              <div>• Provenance: <strong>{trust?.provenance || opp.sourceName || 'Verified Ingestion Feed'}</strong></div>
              <div>• Last Verified: <strong>{opp.lastVerifiedAt ? new Date(opp.lastVerifiedAt).toLocaleDateString() : 'Recent'}</strong></div>
              <div>• Consistency: <strong>{(trust?.contradictionFlags?.length || 0) === 0 ? 'No contradictions detected' : 'Flagged for review'}</strong></div>
            </div>

            {/* Mandatory Internal Quality Disclaimer */}
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--ink-tertiary)',
              lineHeight: 1.45,
              padding: '0.65rem 0.75rem',
              backgroundColor: 'var(--bg-page)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Info size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
              <strong>Internal Quality Indicator:</strong> This score reflects internal metadata completeness, automated consistency audits, and freshness. It is not an external guarantee or warranty that an opportunity is legitimate.
            </div>
          </div>
        </aside>
      </div>

      {/* Admin Edit Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-modal)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="font-editorial" style={{ fontSize: '1.4rem', margin: 0 }}>
                Edit Opportunity Listing
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-tertiary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Opportunity Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Organizer / Organization</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.organization || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, organization: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select
                    className="form-select"
                    value={editFormData.eventType || 'hackathon'}
                    onChange={(e) => setEditFormData({ ...editFormData, eventType: e.target.value })}
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="competition">Competition</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="workshop">Workshop</option>
                    <option value="research">Research</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Format</label>
                  <select
                    className="form-select"
                    value={editFormData.format || 'virtual'}
                    onChange={(e) => setEditFormData({ ...editFormData, format: e.target.value })}
                  >
                    <option value="virtual">Virtual</option>
                    <option value="in_person">In-Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFormData.applicationDeadline || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, applicationDeadline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editFormData.status || 'active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="flagged">Flagged / Quarantine</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
