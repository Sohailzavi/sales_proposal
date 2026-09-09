import React from 'react';
import { OFFICIAL_PROPOSAL } from '../../data/officialProposal.js';
import { documentFormats } from '../../data/defaults.js';
import { proposalTemplates } from '../../data/templates.js';

import { downloadOfficialPdf } from '../../services/exportService.js';

export function OfficialProposalLibrary({
  activeDocumentFormat,
  setActiveDocumentFormat,
  onOpenBuilder,
  onSelectTemplate
}) {
  const invoiceTemplates = proposalTemplates.filter((t) => t.category === 'Invoice');

  return (
    <>
      <aside className="document-sidebar panel" aria-label="Document library">
        <div className="document-sidebar-title">
          <h2>Library</h2>
        </div>

        <nav className="format-list" aria-label="Filter documents by format">
          {documentFormats.map((format) => (
            <button
              key={format.id}
              className={`format-item ${activeDocumentFormat === format.id ? 'active' : ''}`}
              onClick={() => setActiveDocumentFormat(format.id)}
              aria-pressed={activeDocumentFormat === format.id}
            >
              <span className="format-item-left">
                <span className="format-icon">{format.icon}</span>
                <span className="format-name">{format.label}</span>
              </span>
              <span className="format-count">{format.count}</span>
            </button>
          ))}
        </nav>

        <div className="document-list">
          <div className="document-list-label">Files</div>

          {(activeDocumentFormat === 'all' || activeDocumentFormat === 'pdf') && (
            <button
              type="button"
              className="document-card active invoice-card-btn"
              onClick={downloadOfficialPdf}
            >
              <span className="file-icon-box pdf">📕</span>
              <span>
                <strong>AI-Powered Unified Custo...</strong>
                <small>Official proposal · {OFFICIAL_PROPOSAL.fileSize}</small>
              </span>
            </button>
          )}

          {(activeDocumentFormat === 'all' || activeDocumentFormat === 'invoice') && (
            invoiceTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="document-card invoice-card-btn"
                onClick={() => onSelectTemplate(tpl)}
              >
                <span className="file-icon-box inv">🧾</span>
                <span>
                  <strong>{tpl.name}</strong>
                  <small>Editable Invoice · {tpl.invoiceStyle === 'compact' ? 'Compact Teal' : 'Standard Blue'}</small>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {(activeDocumentFormat === 'all' || activeDocumentFormat === 'pdf') ? (
        <section className="official-proposal panel">
          <div className="official-proposal-head">
            <div>
              <div className="eyebrow blue">Official ibunify proposal</div>
              <h2>AI-powered unified customer engagement platform</h2>
              <p>Seven-page product proposal · CRM by iGlobus</p>
            </div>
            <a className="button-link secondary" href={OFFICIAL_PROPOSAL.filePath} target="_blank" rel="noreferrer">
              <span className="btn-icon">⛶</span>
              <span>Open full screen</span>
            </a>
          </div>
          <div className="pdf-viewer-wrapper">
            <object
              className="official-pdf"
              data={`${OFFICIAL_PROPOSAL.filePath}#view=FitH&toolbar=1`}
              type="application/pdf"
              aria-label="iBunify product proposal"
            >
              <div className="pdf-fallback">
                <p>Your browser cannot display the proposal inline.</p>
                <a className="button-link" href={OFFICIAL_PROPOSAL.filePath} target="_blank" rel="noreferrer">
                  Open the proposal
                </a>
              </div>
            </object>
          </div>
        </section>
      ) : activeDocumentFormat === 'invoice' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">🧾</div>
          <h2>Invoice Templates</h2>
          <p>Click any invoice template in the left sidebar to open and edit it in the document builder.</p>
          <div className="invoice-action-buttons">
            {invoiceTemplates.map((tpl) => (
              <button key={tpl.id} className="secondary" onClick={() => onSelectTemplate(tpl)}>
                Edit {tpl.name}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            {documentFormats.find((format) => format.id === activeDocumentFormat)?.icon}
          </div>
          <h2>No {documentFormats.find((format) => format.id === activeDocumentFormat)?.label.toLowerCase()} yet</h2>
          <p>Open the editable builder to create and export this document in that format.</p>
          <button className="primary-blue-btn" onClick={onOpenBuilder}>
            Open editable builder
          </button>
        </section>
      )}
    </>
  );
}
