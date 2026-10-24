import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, HeartHandshake, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-top">
          {/* Brand & Manifesto */}
          <div>
            <div className="footer-brand">OpportunityX</div>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '340px' }}>
              An editorial, production-minded discovery engine connecting ambitious students to verified hackathons, research fellowships, and collaborative technical challenges.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#14B8A6', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Deterministic Match Scoring • Privacy-First Peer Consent</span>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4 className="footer-title">Discovery</h4>
            <ul className="footer-links">
              <li><Link to="/explore?type=hackathon">Collegiate Hackathons</Link></li>
              <li><Link to="/explore?type=competition">Design &amp; Code Contests</Link></li>
              <li><Link to="/explore?type=fellowship">Student Fellowships</Link></li>
              <li><Link to="/explore?type=workshop">Workshops &amp; Bootcamps</Link></li>
              <li><Link to="/explore?type=research">Undergraduate Research</Link></li>
            </ul>
          </div>

          {/* Platform Workflows */}
          <div>
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/roadmaps">Preparation Roadmaps</Link></li>
              <li><Link to="/peer-matching">Peer Collaboration</Link></li>
              <li><Link to="/saved">Deadline Tracker</Link></li>
              <li><Link to="/profile">Academic Profile</Link></li>
              <li><Link to="/admin">Data Health Audit</Link></li>
            </ul>
          </div>

          {/* Ethics & Compliance */}
          <div>
            <h4 className="footer-title">Ethics &amp; Trust</h4>
            <p style={{ color: '#9CA3AF', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Strict anti-scraping policy: All data is ingested via standardized feeds with strict provenance. No automated applications or private credential extraction.
            </p>
            <span className="badge badge-demo" style={{ fontSize: '0.7rem' }}>
              Simulated Demo Listings
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © 2026 OpportunityX Platform. Open Source Educational Architecture.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span>Consent-Based Matching Policy</span>
            <span>Feed Normalization v2.4</span>
            <span>PostgreSQL &amp; Sequelize Persistent Core</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
