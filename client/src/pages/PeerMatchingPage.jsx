import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Users, ShieldCheck, Mail, Send, Check, X, Sparkles, AlertCircle, ArrowRight, Lock, ShieldAlert, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function PeerMatchingPage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [savedOpportunities, setSavedOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState(searchParams.get('opportunityId') || '');
  const [peers, setPeers] = useState([]);
  const [peerMatches, setPeerMatches] = useState({ received: [], sent: [] });
  const [consentRequired, setConsentRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [withdrawingConsent, setWithdrawingConsent] = useState(false);

  // Invite modal state
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [contactDetail, setContactDetail] = useState(user?.email || '');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'received', 'sent'

  const hasConsent = Boolean(user?.profile?.isPublicForMatching || user?.profile?.peerMatchingConsent);

  // Load saved opportunities to select from
  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await api.getSaved();
        const saved = data.saved || [];
        setSavedOpportunities(saved);
        if (!selectedOppId && saved.length > 0) {
          setSelectedOppId(saved[0].opportunityId);
        }
      } catch (err) {
        console.error('Failed to load saved opportunities:', err);
      }
    }

    loadSaved();
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const matchData = await api.getMyPeerMatches();
      setPeerMatches(matchData || { received: [], sent: [] });
    } catch (err) {
      console.error('Failed to load peer matches:', err);
    }
  };

  // Load peers when selected opportunity changes
  useEffect(() => {
    if (!selectedOppId) return;

    async function loadPeers() {
      setLoading(true);
      try {
        const data = await api.getOpportunityPeers(selectedOppId);
        if (data.consentRequired) {
          setConsentRequired(true);
          setPeers([]);
        } else {
          setConsentRequired(false);
          setPeers(data.peers || []);
        }
      } catch (err) {
        console.error('Failed to load peers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPeers();
  }, [selectedOppId, hasConsent]);

  const handleEnableConsent = async () => {
    try {
      await api.updatePeerConsent(true);
      await refreshUser();
      setConsentRequired(false);
      addToast('Peer collaboration consent enabled! You are now discoverable to peers.', 'success');
      if (selectedOppId) {
        setLoading(true);
        const data = await api.getOpportunityPeers(selectedOppId);
        setPeers(data.peers || []);
        setLoading(false);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update consent settings', 'error');
    }
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm('Withdraw collaboration consent? Your profile will be hidden from peer discovery and pending matching requests will be cancelled.')) {
      return;
    }
    setWithdrawingConsent(true);
    try {
      await api.withdrawPeerConsent();
      await refreshUser();
      setConsentRequired(true);
      setPeers([]);
      addToast('Peer collaboration consent withdrawn. Your profile is now private.', 'info');
      loadMatches();
    } catch (err) {
      addToast(err.message || 'Failed to withdraw consent', 'error');
    } finally {
      setWithdrawingConsent(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedPeer || !selectedOppId) return;

    setSendingInvite(true);
    try {
      await api.sendPeerRequest({
        opportunityId: selectedOppId,
        receiverId: selectedPeer.userId,
        message: inviteMessage,
        contactPreference: 'email',
        contactDetail
      });

      addToast(`Collaboration invite sent to ${selectedPeer.fullName}!`, 'success');
      setSelectedPeer(null);
      setInviteMessage('');
      // Reload peers & matches
      const updatedPeers = await api.getOpportunityPeers(selectedOppId);
      setPeers(updatedPeers.peers || []);
      loadMatches();
    } catch (err) {
      addToast(err.message || 'Failed to send invite', 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRespondMatch = async (matchId, action) => {
    try {
      await api.respondPeerRequest(matchId, { action, contactDetail: user.email });
      addToast(action === 'accepted' ? 'Collaboration invite accepted! Contact details shared.' : 'Invite declined.', 'info');
      loadMatches();
      if (selectedOppId) {
        const updatedPeers = await api.getOpportunityPeers(selectedOppId);
        setPeers(updatedPeers.peers || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update invite', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-verified">
              Privacy-Preserving Matching
            </span>
            {hasConsent && !consentRequired ? (
              <span className="badge badge-accent">
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                Consent Active
              </span>
            ) : (
              <span className="badge badge-neutral">
                <Lock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                Opt-in Required
              </span>
            )}
          </div>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Consent-Based Peer Matching
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            Connect with verified student peers who saved the same opportunity. Contact info remains locked until both sides agree to collaborate.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasConsent && !consentRequired && (
            <button
              type="button"
              onClick={handleWithdrawConsent}
              disabled={withdrawingConsent}
              className="btn btn-outline btn-sm"
              style={{ color: '#E11D48', borderColor: '#FECDD3' }}
              title="Stop appearing in peer candidate lists"
            >
              <ShieldAlert size={14} />
              <span>{withdrawingConsent ? 'Withdrawing...' : 'Withdraw Consent'}</span>
            </button>
          )}
          <Link to="/profile" className="btn btn-outline btn-sm">
            <span>Profile &amp; Skills</span>
          </Link>
        </div>
      </div>

      {/* Explicit Consent Callout (if disabled) */}
      {(!hasConsent || consentRequired) && (
        <div className="consent-callout-card" style={{ marginBottom: '2rem' }}>
          <ShieldCheck size={28} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink-primary)', marginBottom: '0.35rem' }}>
              Peer Matching Requires Your Explicit Consent
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              To protect student privacy, OpportunityX never displays your profile to others unless you explicitly opt in. When enabled, only fellow students who also saved the same opportunity can discover your technical skills and send collaboration invites. Email addresses are kept hidden until an invite is accepted.
            </p>
            <button
              type="button"
              onClick={handleEnableConsent}
              className="btn btn-accent btn-sm"
            >
              <Check size={14} />
              <span>Enable Peer Collaboration Consent</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`filter-pill-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover Teammates
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received Invites ({peerMatches.received.filter(m => m.status === 'pending').length})
        </button>
        <button
          type="button"
          className={`filter-pill-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent Requests ({peerMatches.sent.length})
        </button>
      </div>

      {/* TAB 1: Discover Teammates */}
      {activeTab === 'discover' && (
        <div>
          {/* Opportunity Selector Dropdown */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <label htmlFor="oppSelect" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-primary)', display: 'block', marginBottom: '0.25rem' }}>
                Select an Opportunity to Find Peers:
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                Shows peers who saved this opportunity and opted into teammate discovery.
              </span>
            </div>

            <select
              id="oppSelect"
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '320px', fontWeight: 600 }}
            >
              {savedOpportunities.length > 0 ? (
                savedOpportunities.map(s => (
                  <option key={s.opportunityId} value={s.opportunityId}>
                    {s.opportunity?.title || 'Saved Opportunity'}
                  </option>
                ))
              ) : (
                <option value="">No saved opportunities yet</option>
              )}
            </select>
          </div>

          {/* Peer List */}
          {loading ? (
            <div className="grid-cards">
              {[1, 2].map(i => (
                <div key={i} className="card" style={{ height: '260px' }}>
                  <div className="skeleton" style={{ height: '48px', width: '48px', borderRadius: '50%', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ height: '60px' }} />
                </div>
              ))}
            </div>
          ) : peers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Users size={36} color="var(--ink-tertiary)" style={{ margin: '0 auto 1rem' }} />
              <h3 className="font-editorial" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                No peers currently discovered for this opportunity
              </h3>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                As more students save this listing and enable peer collaboration consent, they will appear here with skill alignment scores.
              </p>
              <Link to="/explore" className="btn btn-secondary btn-sm">
                Explore More Opportunities
              </Link>
            </div>
          ) : (
            <div className="grid-cards">
              {peers.map(peer => (
                <div key={peer.userId} className="peer-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div className="peer-avatar">
                      {peer.fullName.charAt(0)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                      {peer.compatibilityScore ? (
                        <span className="badge badge-accent" style={{ fontWeight: 700 }}>
                          <Award size={11} style={{ marginRight: '3px', display: 'inline' }} />
                          {peer.compatibilityScore}% Compatibility
                        </span>
                      ) : null}
                      {peer.matchStatus === 'accepted' ? (
                        <span className="badge badge-verified">Connected</span>
                      ) : peer.matchStatus === 'pending' ? (
                        <span className="badge badge-demo">Invite Pending</span>
                      ) : null}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {peer.fullName}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: 'var(--ink-tertiary)', marginBottom: '0.85rem' }}>
                    {peer.university} • {peer.major || peer.educationLevel}
                    {peer.availability ? ` • ${peer.availability}` : ''}
                  </div>

                  {peer.compatibilityExplanation && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--ink-secondary)',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.85rem',
                      borderLeft: '3px solid var(--accent-primary)',
                      lineHeight: 1.4
                    }}>
                      {peer.compatibilityExplanation}
                    </div>
                  )}

                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', lineHeight: 1.5, marginBottom: '1.25rem', flex: 1 }}>
                    "{peer.matchingBio || 'Looking for teammates with complementary developer or design backgrounds.'}"
                  </p>

                  {/* Shared Skills */}
                  {peer.sharedSkills && peer.sharedSkills.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#0D9488', display: 'block', marginBottom: '0.25rem' }}>
                        Shared Skills
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {peer.sharedSkills.map(s => (
                          <span key={s} className="skill-pill matched">
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shared Interests */}
                  {peer.sharedInterests && peer.sharedInterests.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', display: 'block', marginBottom: '0.25rem' }}>
                        Shared Interests
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {peer.sharedInterests.map(i => (
                          <span key={i} className="skill-pill" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', borderColor: 'transparent' }}>
                            ★ {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complementary Skills */}
                  {peer.complementarySkills && peer.complementarySkills.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-tertiary)', display: 'block', marginBottom: '0.25rem' }}>
                        Complementary Toolkits
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {peer.complementarySkills.slice(0, 3).map(s => (
                          <span key={s} className="skill-pill">
                            + {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Privacy state note */}
                  {peer.matchStatus !== 'accepted' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                      color: 'var(--ink-tertiary)',
                      marginBottom: '0.85rem'
                    }}>
                      <Lock size={12} />
                      <span>Email hidden until invite is accepted</span>
                    </div>
                  )}

                  {/* Actions / Connection info */}
                  {peer.matchStatus === 'accepted' ? (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--teal-50)',
                      border: '1px solid var(--teal-100)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.825rem',
                      color: 'var(--teal-700)'
                    }}>
                      <strong>Direct Contact:</strong> {peer.contactDetail || 'Check received invites'}
                    </div>
                  ) : peer.matchStatus === 'pending' ? (
                    <button type="button" disabled className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                      <span>Invite Pending Response</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeer(peer);
                        setInviteMessage(`Hi ${peer.fullName.split(' ')[0]}! I saw you are preparing for this opportunity and would love to collaborate.`);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <Send size={13} />
                      <span>Invite to Collaborate</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Received Invites */}
      {activeTab === 'received' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {peerMatches.received.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-tertiary)' }}>
              No incoming collaboration invites received yet.
            </div>
          ) : (
            peerMatches.received.map(invite => (
              <div key={invite.id} className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-violet">{invite.opportunity?.title}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {invite.requester?.profile?.fullName || 'A student'} wants to collaborate
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    "{invite.message}"
                  </p>
                  {invite.status === 'accepted' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0D9488', fontWeight: 600 }}>
                      Connected! Shared contact: {invite.contactDetail || invite.requester?.email}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {invite.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespondMatch(invite.id, 'accepted')}
                        className="btn btn-accent btn-sm"
                      >
                        <Check size={14} />
                        <span>Accept Invite</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondMatch(invite.id, 'declined')}
                        className="btn btn-outline btn-sm"
                      >
                        <X size={14} />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span className={`badge ${invite.status === 'accepted' ? 'badge-verified' : 'badge-neutral'}`}>
                      {invite.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Sent Requests */}
      {activeTab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {peerMatches.sent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-tertiary)' }}>
              No sent collaboration invites. Select an opportunity and invite peers!
            </div>
          ) : (
            peerMatches.sent.map(sentInvite => (
              <div key={sentInvite.id} className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginBottom: '0.25rem' }}>
                    Opportunity: {sentInvite.opportunity?.title}
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Invitation to {sentInvite.receiver?.profile?.fullName || 'Student'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
                    "{sentInvite.message}"
                  </p>
                  {sentInvite.status === 'accepted' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0D9488', fontWeight: 600 }}>
                      Accepted! Teammate contact: {sentInvite.contactDetail}
                    </div>
                  )}
                </div>

                <span className={`badge ${sentInvite.status === 'accepted' ? 'badge-verified' : sentInvite.status === 'pending' ? 'badge-demo' : 'badge-neutral'}`}>
                  {sentInvite.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Collaboration Invite Modal */}
      {selectedPeer && (
        <div className="explain-modal-backdrop" onClick={() => setSelectedPeer(null)}>
          <div className="explain-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-violet" style={{ marginBottom: '0.4rem' }}>
                  Peer Collaboration Request
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                  Invite {selectedPeer.fullName} to Team Up
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
                  A private collaboration notification will be sent to their dashboard.
                </p>
              </div>
              <button
                onClick={() => setSelectedPeer(null)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSendInvite}>
              <div className="form-group">
                <label className="form-label" htmlFor="inviteMessage">Collaboration Pitch / Introduction</label>
                <textarea
                  id="inviteMessage"
                  className="form-textarea"
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Introduce yourself, your target track, and how your skills align..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contactDetail">Your Contact Information (Shared upon mutual acceptance)</label>
                <input
                  id="contactDetail"
                  type="text"
                  className="form-input"
                  value={contactDetail}
                  onChange={(e) => setContactDetail(e.target.value)}
                  placeholder="Email or Discord handle (e.g. alex#1234)"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPeer(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="btn btn-primary btn-sm"
                >
                  <Send size={13} />
                  <span>{sendingInvite ? 'Sending...' : 'Send Collaboration Invite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
