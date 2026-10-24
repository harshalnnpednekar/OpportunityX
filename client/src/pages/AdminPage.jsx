import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Database, FileText, UploadCloud, Server, Play, Clock, ArrowRight, Plus, Edit3, Trash2, X, Search, Layers, Users, UserCheck, UserX, UserMinus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function AdminPage() {
  const { addToast } = useToast();
  const [adminSection, setAdminSection] = useState('health'); // 'health' | 'opportunities' | 'users'
  const [adminStats, setAdminStats] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [importsHistory, setImportsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [activeImportId, setActiveImportId] = useState(null);
  const [latestReport, setLatestReport] = useState(null);

  // User Management state
  const [userList, setUserList] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Custom feed tester state
  const [customFeedName, setCustomFeedName] = useState('custom-test-feed');
  const [customFeedType, setCustomFeedType] = useState('json');
  const [customContent, setCustomContent] = useState('');

  // Opportunities Management state
  const [oppList, setOppList] = useState([]);
  const [oppLoading, setOppLoading] = useState(false);
  const [oppSearch, setOppSearch] = useState('');
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [editingOppId, setEditingOppId] = useState(null);
  const [oppFormData, setOppFormData] = useState({
    title: '',
    organizer: '',
    organization: '',
    description: '',
    category: 'general',
    eventType: 'hackathon',
    format: 'virtual',
    location: 'Online',
    applicationDeadline: '',
    costAmount: 0,
    status: 'active',
    requiredSkills: ''
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [health, importsRes, statsRes] = await Promise.all([
        api.getAdminHealth(),
        api.getAdminImports(1, 20),
        api.getAdminStats().catch(() => null)
      ]);
      setHealthData(health);
      setImportsHistory(importsRes.imports || []);
      setAdminStats(statsRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      addToast('Error loading admin catalog telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const res = await api.getAdminUsers({
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        limit: 50
      });
      setUserList(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      addToast('Failed to load user directory', 'error');
    } finally {
      setUserLoading(false);
    }
  };

  const loadOpportunities = async () => {
    setOppLoading(true);
    try {
      const res = await api.getOpportunities({ limit: 50, showDuplicates: 'true', status: 'all' });
      setOppList(res.opportunities || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      addToast('Failed to load opportunities catalog', 'error');
    } finally {
      setOppLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadOpportunities();
    loadUsers();
  }, []);

  useEffect(() => {
    if (adminSection === 'users') {
      loadUsers();
    }
  }, [userRoleFilter, userStatusFilter]);

  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} the account for ${targetUser.name} (${targetUser.email})?`)) return;
    try {
      await api.updateUserStatus(targetUser.id, newStatus);
      addToast(`Account for ${targetUser.name} has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`, 'success');
      loadUsers();
      loadAdminData();
    } catch (err) {
      addToast(err.message || `Failed to ${actionLabel} user`, 'error');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account for ${targetUser.name} (${targetUser.email})? This action cannot be undone.`)) return;
    try {
      await api.deleteAdminUser(targetUser.id);
      addToast(`User account for ${targetUser.name} removed.`, 'info');
      loadUsers();
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleDeleteImport = async (importId) => {
    if (!window.confirm('Delete this feed import execution record?')) return;
    try {
      await api.deleteAdminImport(importId);
      setImportsHistory(prev => prev.filter(imp => imp.id !== importId));
      addToast('Import record removed.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to delete import record', 'error');
    }
  };

  const handleOpenCreateOpp = () => {
    setEditingOppId(null);
    setOppFormData({
      title: '',
      organizer: '',
      organization: '',
      description: '',
      category: 'general',
      eventType: 'hackathon',
      format: 'virtual',
      location: 'Online',
      applicationDeadline: '',
      costAmount: 0,
      status: 'active',
      requiredSkills: ''
    });
    setIsOppModalOpen(true);
  };

  const handleOpenEditOpp = (opp) => {
    setEditingOppId(opp.id);
    setOppFormData({
      title: opp.title || '',
      organizer: opp.organizer || opp.organization || '',
      organization: opp.organization || opp.organizer || '',
      description: opp.description || '',
      category: opp.category || 'general',
      eventType: opp.eventType || 'hackathon',
      format: opp.deliveryFormat || opp.format || 'virtual',
      location: opp.location || 'Online',
      applicationDeadline: opp.applicationDeadline ? opp.applicationDeadline.split('T')[0] : '',
      costAmount: opp.costAmount || 0,
      status: opp.status || 'active',
      requiredSkills: Array.isArray(opp.requiredSkills) ? opp.requiredSkills.join(', ') : ''
    });
    setIsOppModalOpen(true);
  };

  const handleSaveOpp = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...oppFormData,
        requiredSkills: oppFormData.requiredSkills
          ? oppFormData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
          : []
      };

      if (editingOppId) {
        await api.updateOpportunity(editingOppId, payload);
        addToast(`Opportunity "${payload.title}" updated successfully!`, 'success');
      } else {
        await api.createOpportunity(payload);
        addToast(`Opportunity "${payload.title}" created successfully!`, 'success');
      }

      setIsOppModalOpen(false);
      await loadOpportunities();
      await loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to save opportunity', 'error');
    }
  };

  const handleDeleteOpp = async (oppId, oppTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${oppTitle}" from the catalog? This will cascade-remove all linked records.`)) return;
    try {
      await api.deleteOpportunity(oppId);
      setOppList(prev => prev.filter(o => o.id !== oppId));
      addToast('Opportunity deleted successfully.', 'info');
      await loadAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to delete opportunity', 'error');
    }
  };

  const handleImportFeed = async (feedIdentifier, feedLabel) => {
    setIngesting(true);
    setActiveImportId(feedIdentifier);
    try {
      const res = await api.importFeed(feedIdentifier);
      const report = res.report || res.import;
      setLatestReport(report);
      addToast(`Successfully imported ${feedLabel}!`, 'success');
      await loadAdminData();
    } catch (err) {
      addToast(err.message || `Failed to import ${feedLabel}`, 'error');
    } finally {
      setIngesting(false);
      setActiveImportId(null);
    }
  };

  const handleCustomIngest = async (e) => {
    e.preventDefault();
    if (!customContent.trim()) {
      addToast('Please provide a feed payload string', 'warning');
      return;
    }

    setIngesting(true);
    setActiveImportId('custom');
    try {
      const res = await api.triggerFeedIngest({
        feedName: customFeedName,
        feedType: customFeedType,
        content: customContent
      });
      setLatestReport(res.result || res);
      addToast(`Feed "${customFeedName}" normalized and ingested successfully!`, 'success');
      setCustomContent('');
      await loadAdminData();
    } catch (err) {
      addToast(err.message || 'Custom feed ingestion error', 'error');
    } finally {
      setIngesting(false);
      setActiveImportId(null);
    }
  };

  const overview = healthData?.overview || {};

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-danger">Curator &amp; Admin Hub</span>
            <span className="badge badge-neutral">DEMO FIXTURES PIPELINE</span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Data Import &amp; Health Hub
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            Multi-schema normalization, safe XML parsing, idempotent ingestion, similarity duplicate review, and telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleImportFeed('all', 'All 3 Default Feeds')}
          disabled={ingesting}
          className="btn btn-primary btn-sm"
        >
          <RefreshCw size={14} className={ingesting && activeImportId === 'all' ? 'spin' : ''} />
          <span>{ingesting && activeImportId === 'all' ? 'Ingesting All Feeds...' : 'Run All 3 Local Feeds'}</span>
        </button>
      </div>

      {/* Platform Summary Statistics Row (Real PostgreSQL aggregates) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Registered Students
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {adminStats?.totalStudents ?? userList.filter(u => u.role === 'student').length}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 500 }}>
            {adminStats?.activeStudents ?? userList.filter(u => u.status === 'active' && u.role === 'student').length} active ({adminStats?.suspendedUsers ?? userList.filter(u => u.status === 'suspended').length} suspended)
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Active Opportunities
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {adminStats?.activeOpportunities ?? oppList.filter(o => o.status === 'active').length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
            of {adminStats?.totalOpportunities ?? oppList.length} total catalog
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Expired / Archived
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F59E0B', marginTop: '0.35rem' }}>
            {(adminStats?.expiredOpportunities || 0) + (adminStats?.archivedOpportunities || 0)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
            {adminStats?.expiredOpportunities || 0} expired · {adminStats?.archivedOpportunities || 0} archived
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Curators &amp; Admins
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#8B5CF6', marginTop: '0.35rem' }}>
            {adminStats?.totalAdmins ?? 1}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#10B981' }}>
            Protected RBAC guards
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Feed Ingest Batches
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {importsHistory.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
            Latest: {importsHistory[0]?.feedName || 'None'}
          </span>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setAdminSection('health')}
          className={`btn btn-sm ${adminSection === 'health' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Database size={14} />
          <span>Feed Ingestion &amp; Data Health</span>
        </button>
        <button
          type="button"
          onClick={() => setAdminSection('opportunities')}
          className={`btn btn-sm ${adminSection === 'opportunities' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Layers size={14} />
          <span>Shared Opportunity Catalog CRUD ({oppList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setAdminSection('users')}
          className={`btn btn-sm ${adminSection === 'users' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Users size={14} />
          <span>User Management &amp; RBAC ({userList.length})</span>
        </button>
      </div>

      {adminSection === 'health' && (
        <>
          {/* Demo Disclaimer Alert */}
      <div style={{
        padding: '0.9rem 1.25rem',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        border: '1px solid rgba(217, 119, 6, 0.3)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
          <strong style={{ color: '#D97706' }}>DEMO/SAMPLE LOCAL FIXTURES ONLY:</strong> All imported items originate from vetted, local JSON and XML sample files. OpportunityX strictly treats input feeds as untrusted, executes zero foreign scripts, blocks XML external entity expansions (XXE), and does not scrape private or unauthenticated sources.
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '140px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      ) : (
        <>
          {/* Health Gauge & Telemetry Box */}
          <div className="health-score-gauge">
            <div className="gauge-circle" style={{ borderColor: overview.healthScore > 80 ? '#0D9488' : '#D97706' }}>
              {overview.healthScore || 100}%
            </div>

            <div>
              <h2 className="font-editorial" style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
                Catalog Data Health Index
              </h2>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', maxWidth: '560px' }}>
                Ratio of verified, active, non-duplicate opportunities against total catalog records. Duplicates, expired deadlines, and schema anomalies are automatically flagged.
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="dashboard-metrics-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="metric-card">
              <div className="metric-label">Total Catalog Records</div>
              <div className="metric-value">{overview.totalOpportunities}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
                Across JSON &amp; XML sources
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Clean Active Opportunities</div>
              <div className="metric-value" style={{ color: '#0D9488' }}>
                {overview.activeOpportunities}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0D9488', fontWeight: 600, marginTop: '0.25rem' }}>
                Discovery-ready entries
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Expired Records Detected</div>
              <div className="metric-value" style={{ color: '#D97706' }}>
                {overview.expiredOpportunities}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
                Passed deadline quarantined
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Duplicates &amp; Flagged</div>
              <div className="metric-value" style={{ color: '#DC2626' }}>
                {(overview.duplicateOpportunities || 0) + (overview.flaggedOpportunities || 0)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
                Awaiting review / marked dup
              </div>
            </div>
          </div>

          {/* Local Sample Feeds Trigger Bar */}
          <div className="card" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Play size={18} color="#4F46E5" />
              <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                Trigger Local Sample Feed Ingestion
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem' }}>
              Trigger any of the three standardized local fixtures individually to observe multi-schema normalization, field mapping, and idempotency:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* Feed A */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="badge badge-neutral">JSON Feed A</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>sample-hackathons.json</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Hackathons Registry
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                    Standard JSON schema with arrays of items, prize pools, and application dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleImportFeed('sample-json-a', 'JSON Feed A (Hackathons)')}
                  disabled={ingesting}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <RefreshCw size={12} className={ingesting && activeImportId === 'sample-json-a' ? 'spin' : ''} />
                  <span>{ingesting && activeImportId === 'sample-json-a' ? 'Importing...' : 'Import Feed A'}</span>
                </button>
              </div>

              {/* Feed B */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="badge badge-neutral">JSON Feed B</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>sample-workshops.json</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Workshops &amp; Fellowships
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                    Distinct JSON structure with nested tuition objects, alternative field names, and delivery modes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleImportFeed('sample-json-b', 'JSON Feed B (Workshops)')}
                  disabled={ingesting}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <RefreshCw size={12} className={ingesting && activeImportId === 'sample-json-b' ? 'spin' : ''} />
                  <span>{ingesting && activeImportId === 'sample-json-b' ? 'Importing...' : 'Import Feed B'}</span>
                </button>
              </div>

              {/* Feed C */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="badge badge-neutral">XML Feed C</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>sample-competitions.xml</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Academic Competitions
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                    XML tree structure parsed using safe parser settings, entity expansion prevention, and tag normalization.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleImportFeed('sample-xml-a', 'XML Feed C (Competitions)')}
                  disabled={ingesting}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <RefreshCw size={12} className={ingesting && activeImportId === 'sample-xml-a' ? 'spin' : ''} />
                  <span>{ingesting && activeImportId === 'sample-xml-a' ? 'Importing...' : 'Import Feed C'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Latest Run Report Banner if available */}
          {latestReport && (
            <div className="card" style={{ marginBottom: '2.5rem', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid #4F46E5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontWeight: 600, color: '#4F46E5', fontSize: '1.1rem' }}>
                  Latest Ingestion Report: {latestReport.feedName}
                </h4>
                <span className={`badge ${latestReport.status === 'success' ? 'badge-verified' : 'badge-demo'}`}>
                  {latestReport.status?.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div><strong>Records Seen:</strong> {latestReport.recordsSeen ?? latestReport.totalProcessed ?? 0}</div>
                <div><strong>Created:</strong> {latestReport.recordsCreated ?? latestReport.itemsIngested ?? 0}</div>
                <div><strong>Updated:</strong> {latestReport.recordsUpdated ?? latestReport.itemsUpdated ?? 0}</div>
                <div><strong>Duplicates:</strong> {latestReport.duplicatesDetected ?? latestReport.duplicatesFlagged ?? 0}</div>
                <div><strong>Duration:</strong> {latestReport.durationMs || 0}ms</div>
              </div>
            </div>
          )}

          {/* Section: Custom Ingestion Tester & Feed Streams Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Custom Ingestion Tester */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <UploadCloud size={20} color="#4F46E5" />
                <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                  Live Feed Ingestion Adapter Tester
                </h3>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                Paste custom JSON or XML payloads below to test schema normalization, date cleaning, and quality quarantine handling.
              </p>

              <form onSubmit={handleCustomIngest}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Feed Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                      value={customFeedName}
                      onChange={(e) => setCustomFeedName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Feed Format Adapter</label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.85rem' }}
                      value={customFeedType}
                      onChange={(e) => setCustomFeedType(e.target.value)}
                    >
                      <option value="json">Standard JSON Feed</option>
                      <option value="xml">Standard XML Feed Adapter</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Payload String (JSON or XML)</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder={customFeedType === 'json' ? '{"items": [{"id": "test-1", "title": "My Hackathon", "organization": "My Org", ...}]}' : '<competitionFeed><opportunities><entry><name>...</name></entry></opportunities></competitionFeed>'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={ingesting}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <span>Normalize &amp; Ingest Payload</span>
                </button>
              </form>
            </div>

            {/* Source Feeds Breakdown */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Server size={20} color="#0D9488" />
                <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                  Catalog Feed Streams
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(healthData?.feeds || []).map((feed, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{feed.sourceFeed}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>
                        Adapter: {feed.sourceFormat?.toUpperCase()} Safe Parser
                      </div>
                    </div>
                    <span className="badge badge-neutral">
                      {feed.count} records
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Flagged Records & Review Queue Inspector */}
          <div className="card" style={{ marginBottom: '3rem' }}>
            <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Data Quality Audit: Flagged &amp; Quarantine Review Queue
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
              Records flagged for expired deadlines, missing fields, contradictory timelines, or uncertain duplicate similarity:
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Source Feed</th>
                    <th>Status</th>
                    <th>Duplicate?</th>
                    <th>Detected Quality Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {(healthData?.flaggedRecords || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: '2rem' }}>
                        No flagged records found. Catalog is 100% clean.
                      </td>
                    </tr>
                  ) : (
                    (healthData?.flaggedRecords || []).map(record => (
                      <tr key={record.id}>
                        <td>
                          <strong>{record.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)' }}>{record.organization}</div>
                        </td>
                        <td>{record.sourceFeed}</td>
                        <td>
                          <span className={`badge ${record.status === 'expired' ? 'badge-danger' : record.status === 'flagged' ? 'badge-demo' : 'badge-neutral'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          {record.isDuplicate ? (
                            <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.8rem' }}>
                              Yes (Exact Match)
                            </span>
                          ) : record.dataQualityFlags?.includes('uncertain_duplicate_similarity') ? (
                            <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.8rem' }}>
                              Possible Match (Review)
                            </span>
                          ) : 'No'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {(record.dataQualityFlags || []).map((flag, idx) => (
                              <span key={idx} className="badge badge-demo" style={{ fontSize: '0.7rem' }}>
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingestion History Logs Table */}
          <div className="card">
            <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Import Reports &amp; History
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Source Feed</th>
                    <th>Type</th>
                    <th>Seen</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Duplicates</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {importsHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: '2rem' }}>
                        No import runs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    importsHistory.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.startedAt || log.createdAt).toLocaleString()}</td>
                        <td><strong>{log.sourceName}</strong></td>
                        <td>{log.sourceType?.toUpperCase()}</td>
                        <td>{log.recordsSeen ?? log.totalProcessed ?? 0}</td>
                        <td>{log.recordsCreated ?? log.itemsIngested ?? 0}</td>
                        <td>{log.recordsUpdated ?? log.itemsUpdated ?? 0}</td>
                        <td>{log.duplicatesFound ?? log.duplicatesFlagged ?? 0}</td>
                        <td>
                          <span className={`badge ${log.status === 'success' ? 'badge-verified' : log.status === 'warning' ? 'badge-demo' : 'badge-danger'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteImport(log.id)}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#DC2626', borderColor: 'transparent', padding: '0.2rem 0.4rem' }}
                            title="Delete import record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )}

      {/* Opportunities CRUD Section */}
      {adminSection === 'opportunities' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--ink-tertiary)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2rem' }}
                placeholder="Filter by title or org..."
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleOpenCreateOpp}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={14} />
              <span>Create New Opportunity</span>
            </button>
          </div>

          <div className="card">
            {oppLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-tertiary)' }}>
                Loading catalog opportunities...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Opportunity Title</th>
                      <th>Organizer / Org</th>
                      <th>Type</th>
                      <th>Format</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oppList
                      .filter(o => !oppSearch.trim() || o.title?.toLowerCase().includes(oppSearch.toLowerCase()) || (o.organization || o.organizer || '').toLowerCase().includes(oppSearch.toLowerCase()))
                      .map(opp => (
                        <tr key={opp.id}>
                          <td>
                            <strong>{opp.title}</strong>
                          </td>
                          <td>{opp.organization || opp.organizer}</td>
                          <td>
                            <span className="badge badge-neutral">{opp.eventType || opp.opportunityType || 'event'}</span>
                          </td>
                          <td>{opp.deliveryFormat || opp.format || 'Virtual'}</td>
                          <td>
                            {opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleDateString() : 'Rolling'}
                          </td>
                          <td>
                            <span className={`badge ${opp.status === 'active' ? 'badge-verified' : opp.status === 'expired' ? 'badge-danger' : 'badge-demo'}`}>
                              {opp.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditOpp(opp)}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '0.2rem 0.4rem' }}
                                title="Edit Opportunity"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOpp(opp.id, opp.title)}
                                className="btn btn-outline btn-sm"
                                style={{ color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.3)', padding: '0.2rem 0.4rem' }}
                                title="Delete Opportunity"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {oppList.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: '2rem' }}>
                          No opportunities registered yet. Click &quot;Create New Opportunity&quot; to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. User Management & RBAC Directory */}
      {adminSection === 'users' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Top Toolbar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Users size={20} color="var(--ink-primary)" />
                  <span>Platform User Directory &amp; RBAC Controls</span>
                </h2>
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem' }}>
                  Manage student and administrator accounts, inspect academic profiles, and activate or suspend platform access.
                </p>
              </div>

              <button
                type="button"
                onClick={loadUsers}
                disabled={userLoading}
                className="btn btn-outline btn-sm"
              >
                <RefreshCw size={14} className={userLoading ? 'spin' : ''} />
                <span>Refresh Users</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-tertiary)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Search by student name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') loadUsers(); }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '130px' }}
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Administrators</option>
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '130px' }}
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="btn btn-primary btn-sm"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* User List Table */}
            {userLoading ? (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--ink-secondary)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                <span>Loading registered users...</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>University / Major</th>
                      <th>Account Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList
                      .filter(u => {
                        if (!userSearch.trim()) return true;
                        const q = userSearch.toLowerCase();
                        return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                      })
                      .map((targetUser) => (
                        <tr key={targetUser.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: targetUser.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                                color: targetUser.role === 'admin' ? '#8B5CF6' : '#0EA5E9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}>
                                {(targetUser.name || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{targetUser.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>{targetUser.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${targetUser.role === 'admin' ? 'badge-curator' : 'badge-neutral'}`}>
                              {targetUser.role}
                            </span>
                          </td>
                          <td>
                            {targetUser.profile?.university ? (
                              <div>
                                <div style={{ fontWeight: 500 }}>{targetUser.profile.university}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                                  {targetUser.profile.major || targetUser.profile.educationLevel || 'Student'}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--ink-tertiary)', fontSize: '0.82rem' }}>No academic profile</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${targetUser.status === 'suspended' ? 'badge-danger' : 'badge-verified'}`}>
                              {targetUser.status || 'active'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                            {targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {targetUser.status === 'suspended' ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(targetUser)}
                                  className="btn btn-outline btn-sm"
                                  style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                                  title="Reactivate Account"
                                >
                                  <UserCheck size={13} />
                                  <span>Reactivate</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(targetUser)}
                                  className="btn btn-outline btn-sm"
                                  style={{ color: '#D97706', borderColor: 'rgba(217, 119, 6, 0.3)', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}
                                  title="Suspend Account"
                                >
                                  <UserX size={13} />
                                  <span>Suspend</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(targetUser)}
                                className="btn btn-outline btn-sm"
                                style={{ color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.3)', padding: '0.2rem 0.4rem' }}
                                title="Delete User Permanently"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {userList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: '2.5rem' }}>
                          No registered users found matching the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Opportunity Modal */}
      {isOppModalOpen && (
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
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-modal)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="font-editorial" style={{ fontSize: '1.4rem', margin: 0 }}>
                {editingOppId ? 'Edit Opportunity Listing' : 'Create New Shared Opportunity'}
              </h3>
              <button
                type="button"
                onClick={() => setIsOppModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-tertiary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOpp}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Opportunity Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={oppFormData.title}
                  onChange={(e) => setOppFormData({ ...oppFormData, title: e.target.value })}
                  placeholder="e.g. AI for Climate Hackathon 2026"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Organizer / Organization *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={oppFormData.organization}
                    onChange={(e) => setOppFormData({ ...oppFormData, organization: e.target.value, organizer: e.target.value })}
                    placeholder="e.g. Stanford AI Club"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Event Category / Type</label>
                  <select
                    className="form-select"
                    value={oppFormData.eventType}
                    onChange={(e) => setOppFormData({ ...oppFormData, eventType: e.target.value })}
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="competition">Competition</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="workshop">Workshop</option>
                    <option value="research">Research</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Delivery Format</label>
                  <select
                    className="form-select"
                    value={oppFormData.format}
                    onChange={(e) => setOppFormData({ ...oppFormData, format: e.target.value })}
                  >
                    <option value="virtual">Virtual / Remote</option>
                    <option value="in_person">In-Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={oppFormData.location}
                    onChange={(e) => setOppFormData({ ...oppFormData, location: e.target.value })}
                    placeholder="e.g. Online or San Francisco, CA"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={oppFormData.applicationDeadline}
                    onChange={(e) => setOppFormData({ ...oppFormData, applicationDeadline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={oppFormData.status}
                    onChange={(e) => setOppFormData({ ...oppFormData, status: e.target.value })}
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="expired">Expired</option>
                    <option value="flagged">Flagged / Quarantine</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Required / Recommended Skills (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={oppFormData.requiredSkills}
                  onChange={(e) => setOppFormData({ ...oppFormData, requiredSkills: e.target.value })}
                  placeholder="e.g. React, Python, Machine Learning"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Opportunity Description *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={oppFormData.description}
                  onChange={(e) => setOppFormData({ ...oppFormData, description: e.target.value })}
                  placeholder="Provide complete eligibility details, timeline, prizes, and application requirements..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOppModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  {editingOppId ? 'Update Opportunity' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
