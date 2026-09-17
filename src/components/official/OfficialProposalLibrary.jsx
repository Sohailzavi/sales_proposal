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
  IconDiscovery,
  IconNda,
  IconMsa,
  IconCommercialProposal,
  IconSla,
  IconPo,
  IconHandover,
  IconClosure,
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
    case 'discovery':
      return <IconDiscovery size={16} />;
    case 'nda':
      return <IconNda size={16} />;
    case 'msa':
      return <IconMsa size={16} />;
    case 'commercial_proposal':
      return <IconCommercialProposal size={16} />;
    case 'sla':
      return <IconSla size={16} />;
    case 'po':
      return <IconPo size={16} />;
    case 'handover':
      return <IconHandover size={16} />;
    case 'closure':
      return <IconClosure size={16} />;
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
  onOpenDiscovery,
  onOpenNda,
  onOpenMsa,
  onOpenCommercialProposal,
  onOpenSla,
  onOpenPo,
  onOpenHandover,
  onOpenClosure,
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
                } else if (format.id === 'discovery') {
                  onOpenDiscovery();
                } else if (format.id === 'nda') {
                  onOpenNda();
                } else if (format.id === 'msa') {
                  onOpenMsa();
                } else if (format.id === 'commercial_proposal') {
                  onOpenCommercialProposal();
                } else if (format.id === 'sla') {
                  onOpenSla();
                } else if (format.id === 'po') {
                  onOpenPo();
                } else if (format.id === 'handover') {
                  onOpenHandover();
                } else if (format.id === 'closure') {
                  onOpenClosure();
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
              {format.count !== undefined && <span className="format-count">{format.count}</span>}
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
            <div className="pdf-inner-clipper">
              <iframe
                src={`${OFFICIAL_PROPOSAL.filePath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title="Official iGlobus Proposal PDF"
                className="official-pdf"
                scrolling="no"
              />
            </div>
          </div>
        </section>
      ) : activeDocumentFormat === 'proposal' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconCustomProposal size={34} />
          </div>
          <h2>Proposal Studio</h2>
          <p>Create, customize, and export interactive business proposals tailored to your client's needs.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenBuilder}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Proposal Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'invoice' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconInvoices size={34} />
          </div>
          <h2>Interactive Invoice Studio</h2>
          <p>Create, customize, and export professional invoices with itemized billing, taxes, discounts, and payment terms.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenInvoice}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Invoice Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'discovery' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconDiscovery size={34} />
          </div>
          <h2>Discovery — Requirement Gathering & Scoping</h2>
          <p>Create, customize, and export executive requirement discovery blueprints, functional architecture tables, stakeholder goals, and technical integrations.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenDiscovery}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Discovery Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'nda' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconNda size={34} />
          </div>
          <h2>Mutual Non-Disclosure Agreement (NDA) Studio</h2>
          <p>Create, customize, and export legally vetted mutual NDAs, confidentiality covenants, disclosure exceptions, and non-circumvention terms.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenNda}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch NDA Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'msa' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconMsa size={34} />
          </div>
          <h2>Master Services Agreement (MSA) Studio</h2>
          <p>Create, customize, and export master services agreements, framework terms, SOW governance, intellectual property rights, and jurisdiction terms.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenMsa}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch MSA Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'commercial_proposal' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconCommercialProposal size={34} />
          </div>
          <h2>Statement of Work (SOW) Studio</h2>
          <p>Create, customize, and export high-velocity 5-page enterprise statements of work with AI calling, cloud telephony, WhatsApp workflows, Gantt timeline, milestone invoicing, and full commercial schedules.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenCommercialProposal}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch SOW Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'sla' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconSla size={34} />
          </div>
          <h2>Service Level Agreement (SLA) Studio</h2>
          <p>Create, customize, and export official service level agreements, uptime guarantees (99.9%), incident turnaround benchmarks, and multi-tier escalation matrix.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenSla}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch SLA Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'po' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconPo size={34} />
          </div>
          <h2>Purchase Order (PO) Studio</h2>
          <p>Create, customize, and export official purchase orders, PO summaries, itemized order schedules, and dual authorization approval blocks.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenPo}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch PO Studio</span>
            </button>
          </div>
        </section>
      ) : activeDocumentFormat === 'closure' ? (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconClosure size={34} />
          </div>
          <h2>Project Closure & Hypercare Studio</h2>
          <p>Create, customize, and export official project closure certificates, operational KPI scorecards, and warranty support terms.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenClosure}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Closure Studio</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="format-empty panel">
          <div className="empty-file-icon">
            <IconHandover size={34} />
          </div>
          <h2>Delivery & Handover Studio</h2>
          <p>Create, customize, and export official delivery & handover certificates, feature verification checklists, and client PM sign-off acceptance blocks.</p>
          <div className="invoice-action-buttons">
            <button type="button" className="primary-blue-btn" onClick={onOpenHandover}>
              <span className="btn-icon"><IconEdit size={14} /></span>
              <span>Launch Delivery Studio</span>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
