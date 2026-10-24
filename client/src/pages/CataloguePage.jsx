import React, { useReducer, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import OpportunityCard from '../components/OpportunityCard';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';
import api from '../services/api';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const INITIAL_FILTERS = {
  search: '',
  type: '',
  format: 'all',
  cost: 'all',
  experienceLevel: 'all',
  educationLevel: 'all',
  status: 'active',
  sort: 'deadline',
  page: 1
};

function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        [action.payload.key]: action.payload.value,
        page: action.payload.key === 'page' ? action.payload.value : 1
      };
    case 'SYNC_FROM_URL':
      return {
        ...state,
        ...action.payload
      };
    case 'RESET_FILTERS':
      return {
        ...INITIAL_FILTERS
      };
    case 'SET_PAGE':
      return {
        ...state,
        page: action.payload
      };
    default:
      return state;
  }
}

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL search params
  const initialFilterState = useMemo(() => {
    return {
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
  }, []);

  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);

  const [state, setState] = useReducer(
    (prev, next) => ({ ...prev, ...next }),
    { opportunities: [], totalCount: 0, totalPages: 1, loading: true, error: null }
  );

  // Sync reducer changes into URL search params
  const updateUrlParams = useCallback((currentFilters) => {
    const nextParams = new URLSearchParams();
    Object.entries(currentFilters).forEach(([key, val]) => {
      if (val && val !== 'all' && !(key === 'status' && val === 'active') && !(key === 'sort' && val === 'deadline') && !(key === 'page' && val === 1)) {
        nextParams.set(key, String(val));
      }
    });
    setSearchParams(nextParams, { replace: true });
  }, [setSearchParams]);

  // Fetch opportunities from API
  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      setState({ loading: true, error: null });
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

        if (!isCancelled) {
          setState({
            opportunities: data.opportunities || [],
            totalCount: data.total || 0,
            totalPages: data.totalPages || 1,
            loading: false
          });
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load catalogue:', err);
          setState({
            loading: false,
            error: err.message || 'Failed to communicate with opportunity registry service.'
          });
        }
      }
    }

    loadCatalog();
    updateUrlParams(filters);

    return () => {
      isCancelled = true;
    };
  }, [
    filters.search,
    filters.type,
    filters.format,
    filters.cost,
    filters.experienceLevel,
    filters.educationLevel,
    filters.status,
    filters.sort,
    filters.page,
    updateUrlParams
  ]);

  const handleFilterChange = (key, value) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= state.totalPages) {
      dispatch({ type: 'SET_PAGE', payload: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Derived filter computation for UI indicators
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type) count++;
    if (filters.format !== 'all') count++;
    if (filters.cost !== 'all') count++;
    if (filters.experienceLevel !== 'all') count++;
    if (filters.educationLevel !== 'all') count++;
    if (filters.status !== 'active') count++;
    return count;
  }, [filters]);

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
            Showing <strong>{state.opportunities.length}</strong> of <strong>{state.totalCount}</strong> opportunities
            {activeFilterCount > 0 && ` (${activeFilterCount} active filters)`}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar with Debounce */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Error state */}
      {state.error ? (
        <div
          role="alert"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'rgba(185, 28, 28, 0.05)',
            border: '1px solid rgba(185, 28, 28, 0.25)',
            borderRadius: 'var(--radius-xl)',
            margin: '2rem 0'
          }}
        >
          <AlertTriangle size={36} color="var(--accent-danger)" style={{ margin: '0 auto 1rem' }} />
          <h3 className="font-editorial" style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--accent-danger)' }}>
            Error loading catalogue
          </h3>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            {state.error}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={14} />
            <span>Reset and Retry</span>
          </button>
        </div>
      ) : state.loading ? (
        /* Loading Skeletons */
        <div className="grid-cards" aria-busy="true" aria-label="Loading opportunities">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : state.opportunities.length === 0 ? (
        /* Reusable Empty State */
        <EmptyState
          title="No opportunities match your current filters."
          description="Try broadening your search term, switching delivery formats, or resetting filters to view all listings in the active registry."
          action={
            <button type="button" onClick={handleReset} className="btn btn-primary btn-sm">
              Reset Filters
            </button>
          }
        />
      ) : (
        /* Grid of Results with stable keys */
        <div className="grid-cards">
          {state.opportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
            />
          ))}
        </div>
      )}

      {/* Accessible Pagination Controls */}
      {!state.loading && state.totalPages > 1 && (
        <nav className="pagination-controls" aria-label="Opportunity Pagination Navigation">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page <= 1}
            aria-label="Previous Page"
          >
            ← Previous
          </button>

          <span className="pagination-page-indicator" aria-current="page">
            Page {filters.page} of {state.totalPages}
          </span>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page >= state.totalPages}
            aria-label="Next Page"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
