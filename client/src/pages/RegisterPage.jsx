import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    educationLevel: 'undergraduate',
    university: '',
    major: '',
    skillsInput: 'Python, React, PyTorch',
    interestsInput: 'hackathons, AI/ML, fellowships'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const skills = formData.skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const interests = formData.interestsInput.split(',').map(i => i.trim()).filter(Boolean);

      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        educationLevel: formData.educationLevel,
        university: formData.university,
        major: formData.major,
        skills,
        interests
      });

      addToast('Profile created successfully! Welcome to OpportunityX.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1rem 6rem', maxWidth: '580px' }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--ink-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Compass size={22} />
          </div>
          <h2 className="font-editorial" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Create Student Profile
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
            Join OpportunityX to discover matched hackathons, fellowships, and roadmaps
          </p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FEE2E2',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Maya Patel"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="maya@university.edu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 chars"
                required
                minLength={6}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="educationLevel">Academic Standing</label>
              <select
                id="educationLevel"
                name="educationLevel"
                className="form-select"
                value={formData.educationLevel}
                onChange={handleChange}
              >
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate (Master's/PhD)</option>
                <option value="high_school">High School</option>
                <option value="bootcamp">Bootcamp / Self-Taught</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="university">University / Institution</label>
              <input
                id="university"
                name="university"
                type="text"
                className="form-input"
                value={formData.university}
                onChange={handleChange}
                placeholder="e.g. UC Berkeley"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="major">Major / Field of Study</label>
            <input
              id="major"
              name="major"
              type="text"
              className="form-input"
              value={formData.major}
              onChange={handleChange}
              placeholder="e.g. Computer Science &amp; Cognitive Science"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skillsInput">Your Skills (Comma-separated)</label>
            <input
              id="skillsInput"
              name="skillsInput"
              type="text"
              className="form-input"
              value={formData.skillsInput}
              onChange={handleChange}
              placeholder="e.g. Python, React, Rust, Figma"
            />
            <span className="form-hint">Used for deterministic recommendation scoring and peer collaboration matching.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="interestsInput">Preferred Opportunity Types (Comma-separated)</label>
            <input
              id="interestsInput"
              name="interestsInput"
              type="text"
              className="form-input"
              value={formData.interestsInput}
              onChange={handleChange}
              placeholder="e.g. hackathons, AI/ML, fellowships"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            <UserPlus size={15} />
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
