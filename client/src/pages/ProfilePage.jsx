import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Check, Sparkles, Plus, X, Lock, DollarSign, Clock, MapPin, Award, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    educationLevel: 'undergraduate',
    university: '',
    major: '',
    graduationYear: 2027,
    country: 'USA',
    skills: [],
    interests: [],
    budgetMax: 0.00,
    availability: 'flexible',
    experienceLevel: 'beginner',
    preferredFormat: 'all',
    preferredLocation: 'Global',
    peerMatchingConsent: false,
    matchingBio: '',
    githubUrl: '',
    portfolioUrl: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      setFormData({
        fullName: p.fullName || user.name || '',
        bio: p.bio || '',
        educationLevel: p.educationLevel || 'undergraduate',
        university: p.university || '',
        major: p.major || '',
        graduationYear: p.graduationYear || 2027,
        country: p.country || 'USA',
        skills: Array.isArray(p.skills) ? p.skills : [],
        interests: Array.isArray(p.interests) ? p.interests : [],
        budgetMax: p.budgetMax !== undefined ? parseFloat(p.budgetMax) : 0.00,
        availability: p.availability || 'flexible',
        experienceLevel: p.experienceLevel || 'beginner',
        preferredFormat: p.preferredFormat || p.formatPreference || 'all',
        preferredLocation: p.preferredLocation || 'Global',
        peerMatchingConsent: Boolean(p.peerMatchingConsent ?? p.isPublicForMatching),
        matchingBio: p.matchingBio || '',
        githubUrl: p.githubUrl || '',
        portfolioUrl: p.portfolioUrl || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (!newInterest.trim()) return;
    if (!formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
    }
    setNewInterest('');
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interestToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const payload = {
        ...formData,
        budgetMax: parseFloat(formData.budgetMax) || 0.00,
        formatPreference: formData.preferredFormat,
        isPublicForMatching: formData.peerMatchingConsent
      };

      await api.updateProfile(payload);
      await refreshUser();
      setSavedSuccess(true);
      addToast('Profile updated successfully!', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetProfile = async () => {
    if (!window.confirm('Are you sure you want to clear your private profile data? Your skills, interests, and matching preferences will be reset.')) return;
    setLoading(true);
    try {
      await api.resetProfile();
      addToast('Profile data reset to defaults.', 'info');
      if (refreshUser) refreshUser();
      setFormData({
        fullName: user?.name || '',
        bio: '',
        educationLevel: 'undergraduate',
        university: '',
        major: '',
        graduationYear: 2027,
        country: 'USA',
        skills: [],
        interests: [],
        budgetMax: 0.00,
        availability: 'flexible',
        experienceLevel: 'beginner',
        preferredFormat: 'all',
        preferredLocation: 'Global',
        peerMatchingConsent: false,
        matchingBio: '',
        githubUrl: '',
        portfolioUrl: ''
      });
    } catch (err) {
      addToast(err.message || 'Failed to reset profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your OpportunityX account? This action cannot be undone and will delete all your profile data, saved opportunities, and roadmaps.')) {
      return;
    }
    setLoading(true);
    try {
      await api.deleteAccount();
      addToast('Your account has been deleted.', 'info');
      await logout();
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-editorial" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
          Student Academic Profile
        </h1>
        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
          Manage your skills, budget, availability, and privacy controls for automated matching and peer collaboration.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Academic Credentials Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Academic Credentials &amp; Identity
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
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
                <option value="undergraduate">Undergraduate Student</option>
                <option value="graduate">Graduate (Master's / PhD)</option>
                <option value="high_school">High School Student</option>
                <option value="bootcamp">Bootcamp / Self-Taught</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="graduationYear">Expected Graduation Year</label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="number"
                className="form-input"
                value={formData.graduationYear}
                onChange={handleChange}
                min={2024}
                max={2035}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
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

            <div className="form-group">
              <label className="form-label" htmlFor="country">Country of Residence</label>
              <input
                id="country"
                name="country"
                type="text"
                className="form-input"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. USA, Canada, India"
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
              placeholder="e.g. Computer Science &amp; Engineering"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bio">Personal Biography &amp; Goals</label>
            <textarea
              id="bio"
              name="bio"
              className="form-textarea"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about what you build, your research goals, or target hackathons..."
            />
          </div>
        </div>

        {/* Opportunity Discovery Preferences & Budget */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Discovery Constraints &amp; Preferences
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Maximum Budget */}
            <div className="form-group">
              <label className="form-label" htmlFor="budgetMax" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <DollarSign size={14} />
                <span>Maximum Entry Budget ($ USD)</span>
              </label>
              <input
                id="budgetMax"
                name="budgetMax"
                type="number"
                step="5.00"
                min="0"
                className="form-input"
                value={formData.budgetMax}
                onChange={handleChange}
                placeholder="0.00"
              />
              <span className="form-hint">Set to 0 for free/scholarship opportunities only.</span>
            </div>

            {/* Experience Level */}
            <div className="form-group">
              <label className="form-label" htmlFor="experienceLevel" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={14} />
                <span>Experience Level</span>
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className="form-select"
                value={formData.experienceLevel}
                onChange={handleChange}
              >
                <option value="beginner">Beginner (First-time explorer)</option>
                <option value="intermediate">Intermediate (Built projects / attended hackathons)</option>
                <option value="advanced">Advanced (Experienced competitor / researcher)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {/* Availability */}
            <div className="form-group">
              <label className="form-label" htmlFor="availability" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} />
                <span>Weekly Time Availability</span>
              </label>
              <select
                id="availability"
                name="availability"
                className="form-select"
                value={formData.availability}
                onChange={handleChange}
              >
                <option value="flexible">Flexible Schedule</option>
                <option value="part_time">Part-Time (10–20 hrs/week)</option>
                <option value="full_time">Full-Time Commitment</option>
                <option value="weekends">Weekends Only</option>
              </select>
            </div>

            {/* Preferred Delivery Format */}
            <div className="form-group">
              <label className="form-label" htmlFor="preferredFormat">Preferred Delivery Format</label>
              <select
                id="preferredFormat"
                name="preferredFormat"
                className="form-select"
                value={formData.preferredFormat}
                onChange={handleChange}
              >
                <option value="all">All Formats (Virtual, In-Person &amp; Hybrid)</option>
                <option value="virtual">Virtual / Remote Only</option>
                <option value="in_person">In-Person Only</option>
                <option value="hybrid">Hybrid Preferred</option>
              </select>
            </div>
          </div>

          {/* Preferred Location */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="preferredLocation" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} />
              <span>Preferred Target Location</span>
            </label>
            <input
              id="preferredLocation"
              name="preferredLocation"
              type="text"
              className="form-input"
              value={formData.preferredLocation}
              onChange={handleChange}
              placeholder="e.g. Global, North America, San Francisco, Remote"
            />
          </div>
        </div>

        {/* Technical Toolkits & Topics Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            Technical Toolkits &amp; Discovery Interests
          </h3>

          {/* Skills Tag Input */}
          <div className="form-group">
            <label className="form-label">Verified Technical Skills</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g. PyTorch, Rust, React, PostgreSQL)..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(e); } }}
              />
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary btn-sm">
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {formData.skills.map(skill => (
                <span
                  key={skill}
                  className="skill-pill matched"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove skill ${skill}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Opportunity Focus Topics</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add a topic (e.g. AI/ML, Climate, Quant, HealthTech)..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(e); } }}
              />
              <button type="button" onClick={handleAddInterest} className="btn btn-secondary btn-sm">
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {formData.interests.map(interest => (
                <span
                  key={interest}
                  className="skill-pill"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}
                >
                  <span>{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    aria-label={`Remove interest ${interest}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Consent-Based Peer Matching Card */}
        <div className="card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-violet-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} color="#4F46E5" />
            <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
              Consent-Based Peer Collaboration
            </h3>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            OpportunityX strictly adheres to an explicit opt-in model. If enabled, other registered students who saved or prepared for the same opportunities can discover your technical skills and invite you to team up.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: formData.peerMatchingConsent ? 'var(--teal-50)' : 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${formData.peerMatchingConsent ? 'var(--teal-100)' : 'var(--border-subtle)'}`,
            marginBottom: '1.25rem'
          }}>
            <input
              type="checkbox"
              id="peerMatchingConsent"
              name="peerMatchingConsent"
              checked={formData.peerMatchingConsent}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', accentColor: 'var(--teal-600)', marginTop: '2px', cursor: 'pointer' }}
            />
            <div>
              <label htmlFor="peerMatchingConsent" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-primary)', cursor: 'pointer' }}>
                Allow verified students to discover my profile for collaboration on shared opportunities
              </label>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '0.2rem' }}>
                {formData.peerMatchingConsent 
                  ? 'Active: Your profile is discoverable in teammate matching for opportunities you save.'
                  : 'Private: Your profile will NOT appear in any peer searches. Private by default.'}
              </div>
            </div>
          </div>

          {formData.peerMatchingConsent && (
            <div className="form-group">
              <label className="form-label" htmlFor="matchingBio">Teammate Collaboration Pitch</label>
              <textarea
                id="matchingBio"
                name="matchingBio"
                className="form-textarea"
                rows={2}
                value={formData.matchingBio}
                onChange={handleChange}
                placeholder="e.g. Looking for frontend/design partners to build climate tech solutions at CalHacks!"
              />
            </div>
          )}
        </div>

        {/* Action Buttons: Danger Zone & Save */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleResetProfile}
              disabled={loading}
              className="btn btn-outline"
              style={{ color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.4)' }}
            >
              Reset Profile Data
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={loading}
              className="btn btn-outline"
              style={{ color: '#EF4444', borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {savedSuccess && (
              <span style={{ color: '#0D9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                <Check size={16} />
                <span>Saved successfully</span>
              </span>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              <span>{loading ? 'Saving Profile...' : 'Save Profile Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
