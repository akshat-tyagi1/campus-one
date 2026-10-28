import { useState, useMemo } from 'react';
import { notices } from '../data/mockData';

const CATEGORIES = ['All', 'Academic', 'Hostel', 'Facilities', 'Events'];

export default function Notices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter notices
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      if (selectedCategory !== 'All' && notice.category !== selectedCategory) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        notice.title.toLowerCase().includes(q) ||
        notice.office.toLowerCase().includes(q) ||
        notice.body.toLowerCase().includes(q) ||
        notice.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="notices-directory-page">
      {/* Header with Bennett-style red eyebrow */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="section-eyebrow">Announcements</div>
        <h1 className="page-title">Campus Notices & Circulars</h1>
        <p className="page-subtitle">
          Official administrative circulars, hostel advisories, and academic notifications.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px' }}>
        <div className="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search circulars by keyword, office, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search notices"
          />
        </div>

        <div className="filter-chips-row" role="radiogroup" aria-label="Filter notices by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              role="radio"
              aria-checked={selectedCategory === cat}
            >
              {cat === 'All'
                ? `All Notices (${notices.length})`
                : `${cat} (${notices.filter((n) => n.category === cat).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="empty-state-clean">
          <h3>No circulars found</h3>
          <p>No notices matched your current search filters.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="notices-list-grid">
          {filteredNotices.map((notice) => (
            <article
              key={notice.id}
              className={`notice-card-clean ${notice.isImportant ? 'pinned-important' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Category Chip (blue-50/blue-600) */}
                  <span className="notice-category-chip">{notice.category}</span>
                  {/* Pinned Important Chip (red-50/red-600) */}
                  {notice.isImportant && (
                    <span className="notice-important-chip">
                      Important
                    </span>
                  )}
                </div>
                <time style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 500 }}>
                  {notice.date}
                </time>
              </div>

              {/* Issuing Office as small red uppercase eyebrow */}
              <div className="notice-office-eyebrow">
                {notice.office}
              </div>

              <h2 className="notice-main-title">{notice.title}</h2>
              <p className="notice-body-copy">{notice.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
