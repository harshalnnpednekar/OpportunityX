import React from 'react';
import { Search, RotateCcw, Filter, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'competition', label: 'Competitions' },
  { id: 'fellowship', label: 'Fellowships' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'research', label: 'Research' }
];

export default function FilterBar({ filters, onFilterChange, onReset }) {
  const handleCategorySelect = (catId) => {
    onFilterChange('type', catId === 'all' ? '' : catId);
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.type ||
    (filters.format && filters.format !== 'all') ||
    (filters.cost && filters.cost !== 'all') ||
    (filters.experienceLevel && filters.experienceLevel !== 'all') ||
    (filters.educationLevel && filters.educationLevel !== 'all') ||
    (filters.status && filters.status !== 'active')
  );

  return (
    <div className="filter-container" role="search" aria-label="Opportunity filters">
      {/* Primary Search Bar */}
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by keyword, tool (e.g. PyTorch, Rust, ROS), topic (e.g. Climate, AI), or organizer..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          aria-label="Search opportunities"
        />
      </div>

      {/* Primary Category Quick-Pills */}
      <div className="filter-categories-pills">
        {CATEGORIES.map(cat => {
          const isActive = (!filters.type && cat.id === 'all') || filters.type === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`filter-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Multi-Select Filters Row */}
      <div className="filter-secondary-row">
        <div className="filter-selects-group">
          {/* Format */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filters.format || 'all'}
            onChange={(e) => onFilterChange('format', e.target.value)}
            aria-label="Filter by delivery format"
          >
            <option value="all">Format: All Delivery Models</option>
            <option value="virtual">Virtual / Remote</option>
            <option value="in_person">In-Person Only</option>
            <option value="hybrid">Hybrid</option>
          </select>

          {/* Cost */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filters.cost || 'all'}
            onChange={(e) => onFilterChange('cost', e.target.value)}
            aria-label="Filter by cost"
          >
            <option value="all">Cost: All Tiers</option>
            <option value="free">Free Application &amp; Entry</option>
            <option value="stipend_provided">Stipend or Living Grant Provided</option>
          </select>

          {/* Experience Level */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filters.experienceLevel || 'all'}
            onChange={(e) => onFilterChange('experienceLevel', e.target.value)}
            aria-label="Filter by experience level"
          >
            <option value="all">Difficulty: All Experience Levels</option>
            <option value="beginner">Beginner-Friendly</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Education Level */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filters.educationLevel || 'all'}
            onChange={(e) => onFilterChange('educationLevel', e.target.value)}
            aria-label="Filter by education level"
          >
            <option value="all">Education: Open to All</option>
            <option value="undergraduate">Undergraduate Students</option>
            <option value="graduate">Graduate / Master's / PhD</option>
            <option value="high_school">High School</option>
          </select>

          {/* Status (Active / Expired) */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filters.status || 'active'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            aria-label="Filter by status"
          >
            <option value="active">Active Only</option>
            <option value="all">All (Include Expired)</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        {/* Sorting & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem', fontWeight: 600 }}
            value={filters.sort || 'deadline'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            aria-label="Sort opportunities"
          >
            <option value="deadline">Sort: Soonest Deadline</option>
            <option value="relevance">Sort: Highest Match Score</option>
            <option value="newest">Sort: Recently Added</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onReset}
              title="Reset all active filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
