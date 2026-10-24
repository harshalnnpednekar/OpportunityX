import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, ShieldCheck, Zap, ArrowRight, Sparkles, Users, CalendarCheck, CheckCircle } from 'lucide-react';
import OrbitIllustration from '../components/OrbitIllustration';
import OpportunityCard from '../components/OpportunityCard';
import api from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredOpportunities, setFeaturedOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreviews() {
      try {
        const data = await api.getOpportunities({ limit: 6, sort: 'deadline' });
        setFeaturedOpportunities(data.opportunities || []);
      } catch (err) {
        console.error('Failed to load featured opportunities:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPreviews();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div>
      {/* Editorial Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <div className="hero-tag">
              <Sparkles size={14} />
              <span>Intelligent Student Opportunity Discovery</span>
            </div>

            <h1 className="hero-title font-editorial">
              Discover opportunities that align with your craft, not your search luck.
            </h1>

            <p className="hero-subtitle">
              Consolidating collegiate hackathons, open science research, design sprints, and engineering fellowships into one clean, verified discovery catalog. Transparent eligibility checking, deterministic match scoring, and collaborative peer matching.
            </p>

            {/* Functional Hero Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hero-search-box" role="search">
              <Search size={18} color="var(--ink-tertiary)" style={{ marginLeft: '0.5rem' }} />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search by tech stack (Python, React), topic (AI, Climate), or organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search opportunity catalog"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <span>Explore Catalog</span>
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Category Shortcuts */}
            <div className="hero-category-shortcuts">
              <span>Shortcuts:</span>
              <Link to="/explore?type=hackathon" className="shortcut-link">Hackathons</Link>
              <Link to="/explore?type=fellowship" className="shortcut-link">Fellowships</Link>
              <Link to="/explore?type=competition" className="shortcut-link">Competitions</Link>
              <Link to="/explore?type=research" className="shortcut-link">Research Grants</Link>
              <Link to="/explore?type=workshop" className="shortcut-link">Bootcamps</Link>
            </div>
          </div>

          {/* Right Vector Illustration */}
          <div>
            <OrbitIllustration />
          </div>
        </div>
      </section>

      {/* Core Architectural Tenets */}
      <section style={{ padding: '4.5rem 0 3.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Engineered for Ambitious Students</span>
            <h2 className="section-title font-editorial">
              A discovery platform built on transparency, not black-box algorithms.
            </h2>
            <p>
              Traditional discovery is plagued by dead links, expired events, and vague eligibility requirements. OpportunityX establishes a new standard.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={22} color="#0D9488" />
              </div>
              <h3 className="font-editorial">Strict Eligibility Verification</h3>
              <p>
                Relevance and eligibility are kept strictly separate. You receive an automated rule-based diagnostic for academic standing, regional boundaries, and age constraints before you invest time preparing.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <Zap size={22} color="#4F46E5" />
              </div>
              <h3 className="font-editorial">Deterministic Match Scoring</h3>
              <p>
                Every match score (0-100%) comes with an explainable, auditable point breakdown: skill overlaps, preferred focus areas, delivery formats, and planning feasibility.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <CalendarCheck size={22} color="#D97706" />
              </div>
              <h3 className="font-editorial">Preparation Roadmaps</h3>
              <p>
                Never start at the last minute. Automatically generate tailored 4-phase milestone checklists spanning ideation, architecture, MVP prototyping, and demo pitch review.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <Users size={22} color="#0284C7" />
              </div>
              <h3 className="font-editorial">Consent-Based Peer Matching</h3>
              <p>
                Find complementary teammates interested in the same challenge. Explicit opt-in consent model protects your privacy while facilitating real cross-disciplinary collaboration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Real Opportunities Preview */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-tag">Curated Catalog Previews</span>
              <h2 className="font-editorial" style={{ fontSize: '2rem' }}>
                Upcoming Hackathons, Fellowships &amp; Competitions
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
                Demonstration dataset standardized from multi-source JSON and XML feeds.
              </p>
            </div>

            <Link to="/explore" className="btn btn-secondary btn-sm">
              <span>View All 30 Opportunities</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid-cards">
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ height: '360px' }}>
                  <div className="skeleton" style={{ height: '24px', width: '40%', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ height: '32px', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ height: '80px', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ height: '50px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-cards">
              {featuredOpportunities.map(opp => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/explore" className="btn btn-primary btn-lg">
              <span>Explore Complete Catalogue</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
