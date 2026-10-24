import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Database, FileText, UploadCloud, Server } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function AdminPage() {
  const { addToast } = useToast();
  const [healthData, setHealthData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);

  // Custom feed tester
  const [customFeedName, setCustomFeedName] = useState('custom-test-feed');
  const [customFeedType, setCustomFeedType] = useState('json');
  const [customContent, setCustomContent] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [health, logRes] = await Promise.all([
        api.getAdminHealth(),
        api.getAdminLogs()
      ]);
      setHealthData(health);
      setLogs(logRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleIngestAll = async () => {
    setIngesting(true);
    try {
      await api.triggerFeedIngest({
        feedName: 'all-default-feeds',
        feedType: 'json'
      });
      addToast('Ingestion completed across all default JSON & XML feeds!', 'success');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Ingestion failed', 'error');
    } finally {
      setIngesting(false);
    }
  };

  const handleCustomIngest = async (e) => {
    e.preventDefault();
    if (!customContent.trim()) {
      addToast('Please provide feed payload string', 'warning');
      return;
    }

    setIngesting(true);
    try {
      await api.triggerFeedIngest({
        feedName: customFeedName,
        feedType: customFeedType,
        content: customContent
      });
      addToast(`Feed ${customFeedName} ingested successfully!`, 'success');
      setCustomContent('');
      loadAdminData();
    } catch (err) {
      addToast(err.message || 'Custom feed ingestion error', 'error');
    } finally {
      setIngesting(false);
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
          <span className="badge badge-danger" style={{ marginBottom: '0.4rem' }}>
            Curator Access Only
          </span>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Data Health &amp; Ingestion Hub
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            Audit multi-feed normalization, inspect detected duplicate fingerprints, review expired listings, and trigger live feed parsing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleIngestAll}
          disabled={ingesting}
          className="btn btn-primary btn-sm"
        >
          <RefreshCw size={14} className={ingesting ? 'spin' : ''} />
          <span>{ingesting ? 'Processing Ingestion...' : 'Re-Run Default Feeds Ingestion'}</span>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '140px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      ) : (
        <>
          {/* Health Gauge Box */}
          <div className="health-score-gauge">
            <div className="gauge-circle" style={{ borderColor: overview.healthScore > 80 ? '#0D9488' : '#D97706' }}>
              {overview.healthScore || 100}%
            </div>

            <div>
              <h2 className="font-editorial" style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
                Catalog Data Health Index
              </h2>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', maxWidth: '520px' }}>
                Calculated ratio of clean, active, non-duplicate opportunities against total catalog records. Duplicates, expired deadlines, and schema violations are systematically isolated.
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
                Verified discovery entries
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Expired Records Detected</div>
              <div className="metric-value" style={{ color: '#D97706' }}>
                {overview.expiredOpportunities}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
                Automatically flagged
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Duplicates Flagged</div>
              <div className="metric-value" style={{ color: '#DC2626' }}>
                {overview.duplicateOpportunities}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)', marginTop: '0.25rem' }}>
                Fingerprint collisions
              </div>
            </div>
          </div>

          {/* Ingestion & Tester Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
            {/* Custom Ingestion Tester */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <UploadCloud size={20} color="#4F46E5" />
                <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                  Live Feed Ingestion Adapter
                </h3>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
                Paste raw JSON or XML feed content below to test schema normalization, deduplication fingerprinting, and error isolation.
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
                  <span>Ingest &amp; Normalize Feed Payload</span>
                </button>
              </form>
            </div>

            {/* Source Feeds Breakdown */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Server size={20} color="#0D9488" />
                <h3 className="font-editorial" style={{ fontSize: '1.25rem' }}>
                  Registered Feed Streams
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
                        Adapter: {feed.sourceFormat?.toUpperCase()} Parser
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

          {/* Flagged Records Audit Inspector */}
          <div className="card" style={{ marginBottom: '3rem' }}>
            <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Data Quality Audit: Flagged &amp; Quarantine Records
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
              The following opportunities triggered automated data quality warnings (duplicate fingerprint, expired date, contradictory timeline, or missing critical fields).
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
                  {(healthData?.flaggedRecords || []).map(record => (
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
                            Yes (Duplicate)
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingestion History Logs */}
          <div className="card">
            <h3 className="font-editorial" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Feed Ingestion Run History
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Feed Name</th>
                    <th>Adapter</th>
                    <th>Processed</th>
                    <th>Ingested</th>
                    <th>Duplicates</th>
                    <th>Expired</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td><strong>{log.feedName}</strong></td>
                      <td>{log.feedType?.toUpperCase()}</td>
                      <td>{log.totalProcessed}</td>
                      <td>{log.itemsIngested}</td>
                      <td>{log.duplicatesFlagged}</td>
                      <td>{log.expiredFlagged}</td>
                      <td>
                        <span className={`badge ${log.status === 'success' ? 'badge-verified' : 'badge-demo'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
