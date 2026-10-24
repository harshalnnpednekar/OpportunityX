import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Compass, ShieldCheck, Zap, ArrowRight, Sparkles, Users, CalendarCheck, CheckCircle2, Sliders, ExternalLink } from 'lucide-react';
import OrbitIllustration from '../components/OrbitIllustration';
import OpportunityCard from '../components/OpportunityCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
    const query = searchTerm.trim();
    if (query) {
      navigate(`/explore?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div>
      {/* Modern Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <div className="hero-tag">
              <Sparkles size={14} />
              <span>Curated Extracurricular Discovery</span>
            </div>

            <h1 className="hero-title">
              Discover hackathons, grants, and fellowships that match your skills.
            </h1>

            <p className="hero-subtitle">
              Browse vetted collegiate opportunities with transparent match scoring, verified eligibility requirements, and personalized preparation roadmaps.
            </p>

            {/* Functional Modern Hero Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hero-search-box" role="search" aria-label="Quick opportunity search">
              <Search size={18} color="var(--ink-tertiary)" style={{ marginLeft: '0.5rem', flexShrink: 0 }} aria-hidden="true" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search by skill (Python, React), topic (AI, Climate), or host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search opportunity catalog"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <span>Search</span>
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Category Shortcuts */}
            <div className="hero-category-shortcuts">
              <span>Quick browse:</span>
              <Link to="/explore?type=hackathon" className="shortcut-link">Hackathons</Link>
              <Link to="/explore?type=fellowship" className="shortcut-link">Fellowships</Link>
              <Link to="/explore?type=competition" className="shortcut-link">Competitions</Link>
              <Link to="/explore?type=research" className="shortcut-link">Research</Link>
              <Link to="/explore?type=workshop" className="shortcut-link">Workshops</Link>
            </div>
          </div>

          {/* Right Live Interactive Preview */}
          <div>
            <OrbitIllustration />
          </div>
        </div>
      </section>

      {/* Core Architectural Tenets */}
      <section style={{ padding: '4.5rem 0 3.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Platform Features</span>
            <h2 className="section-title">
              Clear criteria, zero black-box guesswork.
            </h2>
            <p>
              Traditional discovery is plagued by dead links, expired events, and vague requirements. OpportunityX gives you verified requirements, transparent scoring, and preparation runways.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(15, 118, 110, 0.08)' }}>
                <ShieldCheck size={22} color="var(--accent-teal)" />
              </div>
              <h3>Verified Eligibility Checks</h3>
              <p>
                Relevance and eligibility are kept strictly separate. Transparent checks explain exactly whether you are eligible, need review, or have explicit disqualifiers.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(79, 70, 229, 0.08)' }}>
                <Zap size={22} color="var(--accent-violet-600)" />
              </div>
              <h3>Transparent Match Scoring</h3>
              <p>
                Every match score comes with an explainable breakdown of matched skills, topic overlap, and suggestions for preparing for application requirements.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(180, 83, 9, 0.08)' }}>
                <CalendarCheck size={22} color="var(--accent-amber)" />
              </div>
              <h3>Preparation Roadmaps</h3>
              <p>
                Avoid last-minute rushes. Automatically generate 4-phase milestone checklists spanning Team Setup, Prototype Sprint, and Final Submission buffers.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(2, 132, 199, 0.08)' }}>
                <Users size={22} color="#0284C7" />
              </div>
              <h3>Privacy-First Peer Matching</h3>
              <p>
                Find complementary teammates interested in the same challenge. Explicit opt-in consent protects your identity while unlocking collaboration.
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
              <h2 className="font-editorial" style={{ fontSize: '2.15rem', color: 'var(--ink-primary)' }}>
                Upcoming Hackathons, Fellowships &amp; Competitions
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
                Active opportunities ingested from multi-format JSON and XML feeds.
              </p>
            </div>

            <Link to="/explore" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Browse Full Catalogue</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid-cards">
              {[1, 2, 3].map(i => (
                <CardSkeleton key={i} />
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
            <Link to="/explore" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Explore Complete Catalogue</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
