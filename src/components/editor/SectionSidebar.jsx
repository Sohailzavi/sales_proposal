import React from 'react';

export function SectionSidebar({
  sections,
  selectedId,
  onSelectSection,
  onAddSection,
  onResetSample
}) {
  return (
    <aside className="sidebar panel">
      <div className="sidebar-head">
        <h2>Sections</h2>
        <button className="icon-button" onClick={onAddSection} title="Add section">＋</button>
      </div>
      <div className="section-list">
        {sections.map((section, index) => {
          const rawTitle = section.title || 'Untitled section';
          const cleanTitle = rawTitle.replace(/^\d+[\.\)]\s*/, '');
          return (
            <button
              key={section.id}
              className={`section-item ${selectedId === section.id ? 'active' : ''}`}
              onClick={() => onSelectSection(section.id)}
            >
              <span>{index + 1}</span>
              <strong>{cleanTitle}</strong>
            </button>
          );
        })}
      </div>
      <button className="secondary full" onClick={onAddSection}>Add section</button>
      <button className="ghost full" onClick={onResetSample}>Restore sample data</button>
    </aside>
  );
}
