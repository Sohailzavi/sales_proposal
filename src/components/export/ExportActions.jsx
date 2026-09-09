import React, { useRef } from 'react';
import { exportPdf, exportWord, exportHtml, exportJson, validateImportedJson, downloadOfficialPdf } from '../../services/exportService.js';

export function ExportActions({
  proposal,
  officialMode,
  setOfficialMode,
  previewMode,
  setPreviewMode,
  onImportProposal,
  onLogout
}) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const result = validateImportedJson(content);
        if (result.valid && result.proposal) {
          onImportProposal(result.proposal);
          alert(`Successfully imported proposal: "${result.proposal.proposalTitle}"`);
        } else {
          alert(result.error || 'Failed to import JSON proposal.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="top-actions">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="secondary btn-icon-text"
        onClick={(e) => {
          e.preventDefault();
          setOfficialMode((value) => !value);
          setPreviewMode(false);
        }}
      >
        <span className="btn-icon">📄</span>
        <span>{officialMode ? 'Open editable builder' : 'Use official proposal'}</span>
      </button>

      {officialMode ? (
        <button
          type="button"
          className="primary-blue-btn"
          onClick={(e) => {
            e.preventDefault();
            downloadOfficialPdf();
          }}
        >
          <span className="btn-icon">📥</span>
          <span>Download PDF</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            className="secondary"
            onClick={(e) => {
              e.preventDefault();
              setPreviewMode((v) => !v);
            }}
          >
            {previewMode ? 'Edit mode' : 'Preview'}
          </button>
          <button
            type="button"
            className="primary-blue-btn"
            onClick={(e) => {
              e.preventDefault();
              exportPdf(proposal);
            }}
          >
            <span className="btn-icon">📥</span>
            <span>Download PDF</span>
          </button>
          <div className="dropdown">
            <button type="button" className="secondary" onClick={(e) => e.preventDefault()}>
              More exports ▾
            </button>
            <div className="dropdown-menu">
              <button type="button" onClick={(e) => { e.preventDefault(); exportWord(proposal); }}>Word document (.doc)</button>
              <button type="button" onClick={(e) => { e.preventDefault(); exportHtml(proposal); }}>HTML</button>
              <button type="button" onClick={(e) => { e.preventDefault(); exportJson(proposal); }}>JSON backup</button>
              <button type="button" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>Import JSON backup</button>
            </div>
          </div>
        </>
      )}

      <button type="button" className="secondary logout-btn" onClick={(e) => { e.preventDefault(); onLogout(); }}>
        Log out
      </button>
    </div>
  );
}
