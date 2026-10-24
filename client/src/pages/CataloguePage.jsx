import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import OpportunityCard from '../components/OpportunityCard';
import api from '../services/api';

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filters = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    format: searchParams.get('format') || 'all',
    cost: searchParams.get('cost') || 'all',
    experienceLevel: searchParams.get('experienceLevel') || 'all',
    educationLevel: searchParams.get('educationLevel') || 'all',
    status: searchParams.get('status') || 'active',
    sort: searchParams.get('sort') || 'deadline',
    page: parseInt(searchParams.get('page') || '1', 10)
  };

  const [opportunities, setOpportunities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch opportunities when query parameters change
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const data = await api.getOpportunities({
          search: filters.search,
          type: filters.type,
          format: filters.format,
          cost: filters.cost,
          experienceLevel: filters.experienceLevel,
          educationLevel: filters.educationLevel,
          status: filters.status,
          sort: filters.sort,
          page: filters.page,
          limit: 12
        });

        setOpportunities(data.opportunities || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load catalogue:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [
    filters.search,
    filters.type,
    filters.format,
    filters.cost,
    filters.experienceLevel,
    filters.educationLevel,
    filters.status,
    filters.sort,
    filters.page
  ]);

  const handleFilterChange = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Reset page to 1 on filter change
    if (key !== 'page') {
      nextParams.set('page', '1');
    }
    setSearchParams(nextParams);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(newPage));
      setSearchParams(nextParams);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      {/* Header */}
      <div className="catalogue-header">
        <div className="catalogue-title-row">
          <div>
            <h1 className="font-editorial" style={{ fontSize: '2.4rem', marginBottom: '0.25rem' }}>
              Opportunity Catalogue
            </h1>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
              Search across collegiate hackathons, competitions, research fellowships, and technical bootcamps.
            </p>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--ink-tertiary)', fontWeight: 500 }}>
            Showing <strong>{opportunities.length}</strong> of <strong>{totalCount}</strong> opportunities
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Grid of Results */}
      {loading ? (
        <div className="grid-cards">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ height: '380px' }}>
              <div className="skeleton" style={{ height: '24px', width: '35%', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '32px', marginBottom: '0.75rem' }} />
              <div className="skeleton" style={{ height: '70px', marginBottom: '1.25rem' }} />
              <div className="skeleton" style={{ height: '40px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: '30px' }} />
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          margin: '2rem 0'
        }}>
          <h3 className="font-editorial" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            No opportunities match your current filters.
          </h3>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Try broadening your search term, switching delivery formats, or resetting filters to view all listings.
          </p>
          <button type="button" onClick={handleReset} className="btn btn-primary btn-sm">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {opportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page <= 1}
          >
            ← Previous
          </button>

          <span className="pagination-page-indicator">
            Page {filters.page} of {totalPages}
          </span>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
