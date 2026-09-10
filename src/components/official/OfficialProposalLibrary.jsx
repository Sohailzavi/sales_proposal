import React from 'react';
import { OFFICIAL_PROPOSAL } from '../../data/officialProposal.js';
import { documentFormats } from '../../data/defaults.js';
import { proposalTemplates } from '../../data/templates.js';
import { downloadOfficialPdf } from '../../services/exportService.js';
import {
  IconAllAssets,
  IconCorporateDeck,
  IconCustomProposal,
  IconInvoices,
  IconEdit,
  IconFullScreen
} from '../common/Icons.jsx';

function getFormatIcon(formatId) {
  switch (formatId) {
    case 'pdf':
      return <IconCorporateDeck size={16} />;
    case 'proposal':
      return <IconCustomProposal size={16} />;
    case 'invoice':
      return <IconInvoices size={16} />;
    case 'all':
    default:
      return <IconAllAssets size={16} />;
  }
}

export function OfficialProposalLibrary({
  activeDocumentFormat,
  setActiveDocumentFormat,
  onOpenBuilder,
  onOpenInvoice,
  onSelectTemplate
}) {
  const invoiceTemplates = proposalTemplates.filter((t) => t.category === 'Invoice');

  return (
    <>
      <aside className="document-sidebar panel" aria-label="Document workspace">
        <div className="document-sidebar-title">
          <h2>Workspace</h2>
        </div>

        <nav className="format-list" aria-label="Filter documents by format">
          {documentFormats.map((format) => (
            <button
              key={format.id}
              type="button"
              className={`format-item ${activeDocumentFormat === format.id ? 'active' : ''}`}
              onClick={() => {
                if (format.id === 'proposal') {
                  onOpenBuilder();
                } else if (format.id === 'invoice') {
                  onOpenInvoice();
                } else {
                  setActiveDocumentFormat(format.id);
                }
              }}
              aria-pressed={activeDocumentFormat === format.id}
            >
              <span className="format-item-left">
                <span className="format-icon">{getFormatIcon(format.id)}</span>
                <span className="format-name">{format.label}</span>
              </span>
              <span className="format-count">{format.count}</span>
            </button>
          ))}
        </nav>

        <div className="document-list">
          <div className="document-list-label">Deliverables</div>

          {(activeDocumentFormat === 'all' || activeDocumentFormat === 'pdf') && (
            <button
              type="button"
              className="document-card active invoice-card-btn"
              onClick={downloadOfficialPdf}
            >
              <span className="file-icon-box pdf">
                <IconCorporateDeck size={18} />
              </span>
              <span>
                <strong>AI-Powered Unified Custo...</strong>
                <small>Official proposal · {OFFICIAL_PROPOSAL.fileSize}</small>
              </span>
            </button>
          )}

          {(activeDocumentFormat === 'all' || activeDocumentFormat === 'proposal') && (
            <button
              type="button"
              className="document-card invoice-card-btn"
              onClick={onOpenBuilder}
            >
              <span className="file-icon-box prop">
                <IconCustomProposal size={18} />
              </span>
              <span>
                <strong>Custom Proposal</strong>
                <small>Editable Proposal · Deal Studio</small>
              </span>
            </button>
          )}

          {(activeDocumentFormat === 'all' || activeDocumentFormat === 'invoice') && (
            invoiceTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="document-card invoice-card-btn"
                onClick={onOpenInvoice}
              >
                <span className="file-icon-box inv">
                  <IconInvoices size={18} />
                </span>
                <span>
                  <strong>{tpl.name}</strong>
                  <small>Editable Invoice · Standard Executive</small>
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
              <div className="eyebrow blue">Official iGlobus proposal</div>
              <h2>AI-powered unified customer engagement platform</h2>
              <p>Seven-page product proposal · CRM by iGlobus</p>
            </div>
            <div className="official-head-actions">
              <a className="button-link secondary" href={OFFICIAL_PROPOSAL.filePath} target="_blank" rel="noreferrer">
                <span className="btn-icon"><IconFullScreen size={14} /></span>
                <span>Open full screen</span>
              </a>
            </div>
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

          <div className="deck-bottom-action-bar">
            <div className="deck-bottom-info">
              <strong>Need to create or customize a client proposal?</strong>
              <span>Tailor executive summary, scope of work, timeline, and commercial pricing.</span>
            </div>
            <button
              type="button"
              className="primary-blue-btn deck-customize-btn"
              onClick={onOpenBuilder}
            >
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Customize in Proposal Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'proposal' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconCustomProposal size={34} />
          </div>
          <h2>Custom Proposal Studio</h2>
          <p>Create, customize, and export client-ready sales proposals with custom scope, timelines, and commercial tables.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenBuilder}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Proposal Studio</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconInvoices size={34} />
          </div>
          <h2>Standard Invoice Studio</h2>
          <p>Create, customize, and export executive invoices with corporate branding, line item details, and CGST/SGST tax breakdown.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenInvoice}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Invoice Studio</span>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
