import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Database, FileText, UploadCloud, Server, Play, Clock, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function AdminPage() {
  const { addToast } = useToast();
  const [healthData, setHealthData] = useState(null);
  const [importsHistory, setImportsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [activeImportId, setActiveImportId] = useState(null);
  const [latestReport, setLatestReport] = useState(null);

  // Custom feed tester state
  const [customFeedName, setCustomFeedName] = useState('custom-test-feed');
  const [customFeedType, setCustomFeedType] = useState('json');
  const [customContent, setCustomContent] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [health, importsRes] = await Promise.all([
        api.getAdminHealth(),
        api.getAdminImports(1, 20)
      ]);
      setHealthData(health);
      setImportsHistory(importsRes.imports || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      addToast('Error loading admin catalog telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

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
                  </tr>
                </thead>
                <tbody>
                  {importsHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-tertiary)', padding: '2rem' }}>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
