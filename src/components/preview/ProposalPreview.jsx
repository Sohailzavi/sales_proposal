import React from 'react';
import { calculateCommercialTotals, calculateInvoiceTotals, paginateProposal } from '../../services/exportService.js';
import { SAMPLE_LETTERHEAD_BASE64 } from '../../data/letterheadBase64.js';

function sanitizeProposalData(data) {
  if (typeof data === 'string') {
    return data
      .replace(/[iI][bB][uU][nN][iI][fF][yY]/g, 'iBUNIFY');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeProposalData);
  }
  if (data && typeof data === 'object') {
    const res = {};
    for (const key of Object.keys(data)) {
      res[key] = sanitizeProposalData(data[key]);
    }
    return res;
  }
  return data;
}

export function ProposalPreview({ proposal: rawProposal }) {
  const proposal = sanitizeProposalData(rawProposal) || {};
  const currencySymbol = proposal.currency === 'USD' ? '$' : '₹';
  const isInvoice = proposal.documentType === 'invoice';

  if (isInvoice) {
    const style = proposal.invoiceStyle === 'standard' ? 'standard' : 'compact';
    const items = proposal.invoiceItems || [];
    const { netSubtotal, totalDiscount, cgstAmount, sgstAmount, totalDue } = calculateInvoiceTotals(items, proposal.cgstPct, proposal.sgstPct);

    if (style === 'standard') {
      const subtotal = items.reduce(
        (total, item) => total + (Number(item.qty) || 0) * (Number(item.rate) || 0),
        0
      );
      const curr = proposal.currency === 'USD' ? 'INR' : (proposal.currency || 'INR');
      const formatMoney = (amount) => {
        try {
          return new Intl.NumberFormat(curr === 'INR' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: curr,
            maximumFractionDigits: 2
          }).format(amount);
        } catch {
          return `₹${Number(amount).toLocaleString()}`;
        }
      };

      const cgstPct = typeof proposal.cgstPct === 'number' ? proposal.cgstPct : 9;
      const sgstPct = typeof proposal.sgstPct === 'number' ? proposal.sgstPct : 9;
      const cgst = (subtotal * cgstPct) / 100;
      const sgst = (subtotal * sgstPct) / 100;
      const total = subtotal + cgst + sgst;

      const companyAddressLines = (proposal.companyAddress || proposal.companyMeta || 'Techno Enclave Madhapur, Hyderabad, Telangana 500081').split('\n');
      const clientAddressLines = (proposal.clientAddress || '22 Harbour Line Road\nBandra East, Mumbai 400051\nIndia').split('\n');

      return (
        <div className="proposal-pages-container invoice-pages-container">
          <section className="invoice-paper standard-invoice-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <header className="std-inv-header">
                <div>
                  <h1 className="std-inv-title">{proposal.proposalTitle || 'Invoice'}</h1>
                  <dl className="std-inv-meta-grid">
                    <dt>Invoice no.</dt>
                    <dd>{proposal.proposalNumber || 'INV-2026-0148'}</dd>
                    <dt>Issued</dt>
                    <dd>{proposal.date || 'Sep 10, 2026'}</dd>
                    <dt>Due</dt>
                    <dd>{proposal.validUntil || 'Oct 10, 2026'}</dd>
                    <dt>Terms</dt>
                    <dd>{proposal.paymentTerms || 'Net 30'}</dd>
                  </dl>
                </div>

                <div className="std-inv-company-block">
                  {proposal.companyLogoUrl ? (
                    <img
                      src={proposal.companyLogoUrl}
                      alt={`${proposal.company} logo`}
                      className="std-inv-logo"
                    />
                  ) : (
                    <div className="std-inv-brand-mark">
                      {proposal.companyBadge || 'iG'}
                    </div>
                  )}
                  <p className="std-inv-company-name">{proposal.company || 'iGlobus Corporate Consulting'}</p>
                  <address className="std-inv-address">
                    {companyAddressLines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    {proposal.companyPhone && <p>Phone: {proposal.companyPhone}</p>}
                  </address>
                </div>
              </header>

              <section className="std-inv-billto-section" aria-labelledby="std-bill-to">
                <h2 id="std-bill-to" className="std-inv-section-label">
                  Bill to
                </h2>
                <p className="std-inv-client-name">{proposal.preparedFor || 'Northwind Retail Pvt. Ltd.'}</p>
                <address className="std-inv-client-address">
                  {proposal.clientAttention && <p>{proposal.clientAttention}</p>}
                  {clientAddressLines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  {proposal.clientEmail && <p>{proposal.clientEmail}</p>}

                </address>
              </section>

              <section className="std-inv-items-section">
                <table className="std-inv-table">
                  <thead>
                    <tr>
                      <th style={{ width: '56px', textAlign: 'left' }}>S. No.</th>
                      <th style={{ textAlign: 'left' }}>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const qty = Number(item.qty) || 0;
                      const rate = Number(item.rate) || 0;
                      const amount = qty * rate;
                      return (
                        <tr key={item.id || index}>
                          <td className="std-inv-sno">{index + 1}</td>
                          <td>
                            <p className="std-inv-item-desc">{item.description}</p>
                            {item.detail && <p className="std-inv-item-detail">{item.detail}</p>}
                          </td>
                          <td style={{ textAlign: 'right' }}>{qty}</td>
                          <td style={{ textAlign: 'right' }}>{formatMoney(rate)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="std-inv-totals-wrap">
                  <dl className="std-inv-totals-list">
                    <div className="std-inv-totals-row">
                      <dt>Subtotal</dt>
                      <dd>{formatMoney(subtotal)}</dd>
                    </div>
                    <div className="std-inv-totals-row">
                      <dt>CGST ({cgstPct}%)</dt>
                      <dd>{formatMoney(cgst)}</dd>
                    </div>
                    <div className="std-inv-totals-row">
                      <dt>SGST ({sgstPct}%)</dt>
                      <dd>{formatMoney(sgst)}</dd>
                    </div>
                    <div className="std-inv-totals-row std-inv-total-due">
                      <dt>Total due</dt>
                      <dd>{formatMoney(total)}</dd>
                    </div>
                  </dl>
                </div>
              </section>

              <footer className="std-inv-footer">
                <h2 className="std-inv-section-label">Payment details</h2>
                <p className="std-inv-notes">{proposal.notes || 'Payment by bank transfer to iGlobus Pvt. Ltd., HDFC Bank, A/C 5010 2233 4455, IFSC HDFC0000123. Please reference the invoice number with your payment.'}</p>
              </footer>
            </div>

          </section>
        </div>
      );
    }

    // Compact Invoice View
    return (
      <div className="proposal-pages-container invoice-pages-container">
        <section className="invoice-paper compact-invoice-paper">
          <img
            src={SAMPLE_LETTERHEAD_BASE64}
            className="letterhead-bg-img"
            alt="Letterhead Background"
          />
          <div className="letterhead-content-wrap">
            <div className="compact-top">
              <div>
                <div className="compact-company-name">{proposal.company}</div>
                <div className="compact-company-meta">{proposal.companyMeta}</div>

              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="compact-doc-title">{proposal.proposalTitle || 'INVOICE'}</div>
                <div className="compact-doc-meta">
                  No. {proposal.proposalNumber} &nbsp;|&nbsp; Issued {proposal.date} &nbsp;|&nbsp; Due {proposal.validUntil}
                </div>
                <span className="compact-status-tag">{proposal.invoiceStatus || 'PENDING'}</span>
              </div>
            </div>

            <div className="compact-parties">
              <div>
                <div className="compact-lbl">Bill to</div>
                <div className="compact-name">{proposal.preparedFor}</div>
                {proposal.clientAddress}
              </div>
              <div>
                <div className="compact-lbl">Terms</div>
                {proposal.paymentTerms || 'Net 15 days'} &nbsp;|&nbsp; Place of supply: {proposal.placeOfSupply || 'Telangana'}
              </div>
            </div>

            <table className="compact-items-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Disc.</th>
                  <th style={{ textAlign: 'right' }}>Tax</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const qty = Number(item.qty) || 0;
                  const rate = Number(item.rate) || 0;
                  const lineGross = qty * rate;
                  let lineDisc = 0;
                  if (item.discountAmount) lineDisc = Number(item.discountAmount) || 0;
                  else if (item.discountPct) lineDisc = (lineGross * (Number(item.discountPct) || 0)) / 100;
                  const lineNet = lineGross - lineDisc;
                  const taxRate = item.taxPct || ((Number(proposal.cgstPct) || 0) + (Number(proposal.sgstPct) || 0));
                  const lineTotal = lineNet + (lineNet * taxRate) / 100;

                  return (
                    <tr key={item.id}>
                      <td>{item.description} ({item.hsnSac || ''})</td>
                      <td style={{ textAlign: 'right' }}>{qty} {item.unit || ''}</td>
                      <td style={{ textAlign: 'right' }}>{rate.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {item.discountPct ? `${item.discountPct}%` : item.discountAmount ? `${item.discountAmount}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>{taxRate}%</td>
                      <td style={{ textAlign: 'right' }}>{lineTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="compact-totals-wrap">
              <div className="compact-totals">
                <div className="compact-row"><span>Subtotal</span><span>{(netSubtotal + totalDiscount).toLocaleString()}</span></div>
                <div className="compact-row"><span>Discount</span><span>−{totalDiscount.toLocaleString()}</span></div>
                <div className="compact-row"><span>CGST {proposal.cgstPct || 9}%</span><span>{cgstAmount.toLocaleString()}</span></div>
                <div className="compact-row"><span>SGST {proposal.sgstPct || 9}%</span><span>{sgstAmount.toLocaleString()}</span></div>
                <div className="compact-row compact-grand"><span>Total Due</span><span>{currencySymbol}{totalDue.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="compact-lower">
              <div>
                <div className="compact-lbl">Notes</div>
                {proposal.notes}
              </div>
              <div>
                <div className="compact-lbl">Payment</div>
                <div className="compact-bank-grid">
                  <div><span className="compact-k">Bank</span>{proposal.bankName}</div>
                  <div><span className="compact-k">A/C</span>{proposal.accountNo}</div>
                  <div><span className="compact-k">IFSC</span>{proposal.ifscCode}</div>
                  <div><span className="compact-k">UPI</span>{proposal.upiId}</div>
                </div>
              </div>
            </div>

            <div className="compact-footer">Computer-generated invoice · {proposal.company}</div>
          </div>
        </section>
      </div>
    );
  }

  const isDiscovery = proposal.documentType === 'discovery';

  if (isDiscovery) {
    const pipelineStages = proposal.pipelineStages || [];
    const useStructuredTable = proposal.useStructuredTable !== false;
    const sections = proposal.sections || [];

    const secObjectives = sections[0] || {
      title: '1. BUSINESS OBJECTIVES & OPERATIONAL SCOPE',
      content:
        'This Discovery Document establishes the functional and technical requirements for deploying the ibunify platform. It maps existing lead channels, sales team structures, and automation triggers.'
    };
    const secIngestion = sections[1] || {
      title: '2. LEAD INGESTION & CHANNEL ARCHITECTURE',
      content:
        '• Digital Channels: Meta Ads (Facebook/Instagram), Google Search & Display Ads, Website Landing Page forms.\n• Portals: Automated webhook ingestion from 99acres, MagicBricks, Housing.com, and CommonFloor.\n• Inbound & Offline: Dedicated Cloud Telephony virtual numbers, QR code campaign scans, and property walk-in entries.'
    };
    const secPipeline = sections[2] || {
      title: '3. SALES HIERARCHY & PIPELINE STAGES',
      content: 'Configured pipeline stage mapping and automated CRM actions upon lead state transitions.'
    };
    const secSignoff = sections[3] || {
      title: '4. SIGN-OFF FOR SCOPING BASELINE',
      content: 'The undersigned agree that the requirements detailed above represent the baseline for project deployment.'
    };

    const remainingSections = sections.slice(4);

    return (
      <div className="proposal-pages-container discovery-pages-container">
        {/* Page 1: Official Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                {/* Title & Overview */}
                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Discovery — Requirement Gathering & Scoping'}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                {/* Bottom Two-Column Metadata Box */}
                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-01-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.date ? proposal.date : '______________________'}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Page 2: Structured Scoping & Sign-Off Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · Requirement Gathering & Scoping</span>
          </div>
          <section className="discovery-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              {/* Document Body Sections */}
              <div className="discovery-p2-body">
                {/* Section 1 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{secObjectives.title}</h2>
                  <div className="discovery-section-text">{secObjectives.content}</div>
                </div>

                {/* Section 2 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{secIngestion.title}</h2>
                  <div className="discovery-section-text discovery-bullet-list">
                    {secIngestion.content.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="discovery-bullet-item">{line}</div>
                    ))}
                  </div>
                </div>

                {/* Section 3 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{secPipeline.title}</h2>
                  {useStructuredTable ? (
                    <div className="discovery-pipeline-table-wrap">
                      <table className="discovery-pipeline-table">
                        <thead>
                          <tr>
                            <th style={{ width: '28%' }}>PIPELINE STAGE</th>
                            <th style={{ width: '32%' }}>PRIMARY OBJECTIVE</th>
                            <th style={{ width: '40%' }}>AUTOMATED SYSTEM ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pipelineStages.map((st) => (
                            <tr key={st.id}>
                              <td className="stage-name-cell"><strong>{st.stage}</strong></td>
                              <td>{st.objective}</td>
                              <td>{st.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="discovery-section-text">{secPipeline.content}</div>
                  )}
                </div>

                {/* Section 4: Sign-off Baseline */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{secSignoff.title}</h2>
                  <p className="discovery-signoff-desc">{secSignoff.content}</p>

                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box', marginTop: '10px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || proposal.clientSignatory || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.clientSignatoryName || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || proposal.leadSignatory || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.leadSignatoryName || proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.leadSignatoryTitle || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.leadSignDate ? proposal.leadSignDate : (proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                  </div>
                </div>

                {/* Any user-added extra sections */}
                {remainingSections.map((sec) => (
                  <div key={sec.id} className="discovery-section-block">
                    <h2 className="discovery-section-title">{sec.title}</h2>
                    <div className="discovery-section-text">{sec.content}</div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      </div>
    );
  }

  const isNda = proposal.documentType === 'nda';

  if (isNda) {
    const sections = proposal.sections || [];
    const sec1 = sections[0] || {
      title: '1. PURPOSE OF ENGAGEMENT',
      content: `This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of ${proposal.effectiveDate || proposal.date ? (proposal.effectiveDate || proposal.date) : '______________________'} by and between iGLOBUS Corporate Consulting Private Limited ("ibunify") and ${proposal.preparedFor || '[Client Company Name]'} ("Client") to protect proprietary technical, commercial, and customer information.`
    };
    const sec2 = sections[1] || {
      title: '2. DEFINITION OF CONFIDENTIAL INFORMATION',
      content:
        '"Confidential Information" includes all technical data, customer leads, pricing matrices, source codes, AI prompts, marketing strategies, telephony records, and business workflows disclosed by either party.'
    };
    const sec3 = sections[2] || {
      title: '3. OBLIGATIONS OF CONFIDENTIALITY',
      content:
        '• Both parties agree to hold all Confidential Information in strict trust and confidence using the same degree of care as for their own proprietary data (at minimum reasonable care).\n• Confidential Information shall not be disclosed to any third party without prior written authorization.\n• Full compliance with Indian Digital Personal Data Protection (DPDPA) Act 2023 regulations regarding Data Principal rights.'
    };
    const sec4 = sections[3] || {
      title: '4. TERM & EXECUTION',
      content:
        'This Agreement remains in effect for a period of Three (3) Years from the Effective Date.'
    };

    const remainingSections = sections.slice(4);

    return (
      <div className="proposal-pages-container nda-pages-container">
        {/* Page 1: Official Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper nda-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                {/* Central Badge, Title & Overview */}
                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Mutual Non-Disclosure Agreement'}
                    {proposal.proposalTitle && !proposal.proposalTitle.includes('(NDA)') && (
                      <span style={{ display: 'block', marginTop: '4px' }}>(NDA)</span>
                    )}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                {/* Bottom Two-Column Metadata Box */}
                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-02-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.effectiveDate ? proposal.effectiveDate : (proposal.date ? proposal.date : '______________________')}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Page 2: NDA Clauses & Execution */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · Terms & Execution</span>
          </div>
          <section className="discovery-content-paper nda-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              {/* Document Clauses Flow */}
              <div className="discovery-p2-body">
                {/* Clause 1 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec1.title}</h2>
                  <div className="discovery-section-text">{sec1.content}</div>
                </div>

                {/* Clause 2 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec2.title}</h2>
                  <div className="discovery-section-text">{sec2.content}</div>
                </div>

                {/* Clause 3 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec3.title}</h2>
                  <div className="discovery-section-text discovery-bullet-list">
                    {sec3.content.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="discovery-bullet-item">{line}</div>
                    ))}

                  </div>
                </div>

                {/* Clause 4 & Execution Block */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec4.title}</h2>
                  <p className="discovery-signoff-desc">{sec4.content}</p>

                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box', marginTop: '10px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || proposal.clientSignatory || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.clientSignatoryName || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || proposal.leadSignatory || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.leadSignatoryName || proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.leadSignatoryTitle || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.leadSignDate ? proposal.leadSignDate : (proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                  </div>
                </div>

                {/* Any user-added extra clauses */}
                {remainingSections.map((sec) => (
                  <div key={sec.id} className="discovery-section-block">
                    <h2 className="discovery-section-title">{sec.title}</h2>
                    <div className="discovery-section-text">{sec.content}</div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        </div>
      </div>
    );
  }

  const isMsa = proposal.documentType === 'msa';

  if (isMsa) {
    const sections = proposal.sections || [];
    const sec1 = sections[0] || {
      title: '1. FRAMEWORK AGREEMENT & TERM',
      content: `This Master Services Agreement ("MSA") is entered into as of ${proposal.effectiveDate || proposal.date ? (proposal.effectiveDate || proposal.date) : '______________________'} by and between iGLOBUS Corporate Consulting Private Limited ("ibunify") and ${proposal.preparedFor || '[Client Company Name]'} ("Client"). This MSA governs all Statements of Work (SOW) executed between the parties for a term of 12 months with automatic annual renewal.`
    };
    const sec2 = sections[1] || {
      title: '2. SCOPE OF PLATFORM SERVICES',
      content:
        'ibunify agrees to provide SaaS licensing, AI Calling agents, Cloud Telephony, WhatsApp Business API integrations, and ongoing technical support as set forth in applicable SOWs.'
    };
    const sec3 = sections[2] || {
      title: '3. INTELLECTUAL PROPERTY RIGHTS',
      content:
        '• Client Ownership: Client exclusively owns all customer records, prospect leads, call recordings, and corporate data stored within the platform.\n• Service Provider Ownership: ibunify exclusively owns the software platform, source code, AI voice models, API connectors, and system enhancements.'
    };
    const sec4 = sections[3] || {
      title: '4. PAYMENT TERMS & INVOICING',
      content:
        'All invoices are payable within 30 calendar days (NET 30). Late payments shall incur interest at 1.5% per month or the maximum rate permitted by law.'
    };
    const sec5 = sections[4] || {
      title: '5. GOVERNING LAW & DISPUTE RESOLUTION',
      content:
        'This Agreement shall be governed by the laws of India with exclusive jurisdiction in Hyderabad, Telangana.'
    };

    const remainingSections = sections.slice(5);

    return (
      <div className="proposal-pages-container msa-pages-container">
        {/* Page 1: Official Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper msa-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Master Services Agreement (MSA)'}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-04-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.executionDate ? proposal.executionDate : (proposal.date ? proposal.date : '______________________')}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Page 2: MSA Clauses & Execution */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · Framework & Execution</span>
          </div>
          <section className="discovery-content-paper msa-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="discovery-p2-body">
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec1.title}</h2>
                  <div className="discovery-section-text">{sec1.content}</div>
                </div>

                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec2.title}</h2>
                  <div className="discovery-section-text">{sec2.content}</div>
                </div>

                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec3.title}</h2>
                  <div className="discovery-section-text discovery-bullet-list">
                    {sec3.content.split('\n').map((line, lIdx) => (
                      <div key={lIdx} className="discovery-bullet-item">{line}</div>
                    ))}

                  </div>
                </div>

                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec4.title}</h2>
                  <div className="discovery-section-text">{sec4.content}</div>
                </div>

                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">{sec5.title}</h2>
                  <div className="discovery-section-text">{sec5.content}</div>
                </div>

                {/* Execution Block */}
                <div className="discovery-section-block">
                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box', marginTop: '10px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || proposal.clientSignatory || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.clientSignatoryName || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                    </div>

                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || proposal.leadSignatory || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.leadSignatoryName || proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.leadSignatoryTitle || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.leadSignDate ? proposal.leadSignDate : (proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                  </div>
                </div>

                {/* Any user-added extra clauses */}
                {remainingSections.map((sec) => (
                  <div key={sec.id} className="discovery-section-block">
                    <h2 className="discovery-section-title">{sec.title}</h2>
                    <div className="discovery-section-text">{sec.content}</div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        </div>
      </div>
    );
  }

  const isSla = proposal.documentType === 'sla';

  if (isSla) {
    const incidentBenchmarks = proposal.incidentBenchmarks || [
      {
        id: 'inc-1',
        level: 'P1 - Critical',
        impact: 'Total platform outage, lead ingestion halted, telephony down',
        responseSla: '< 30 Minutes',
        resolutionTarget: '< 4 Hours'
      },
      {
        id: 'inc-2',
        level: 'P2 - High',
        impact: 'Core feature degraded (e.g., WhatsApp dispatch lag), workaround available',
        responseSla: '< 2 Hours',
        resolutionTarget: '< 8 Hours'
      },
      {
        id: 'inc-3',
        level: 'P3 - Medium',
        impact: 'Minor UI defect, non-critical report generation delay',
        responseSla: '< 4 Hours',
        resolutionTarget: '< 24 Hours'
      },
      {
        id: 'inc-4',
        level: 'P4 - Low',
        impact: 'General query, configuration assistance, user permission update',
        responseSla: '< 8 Hours',
        resolutionTarget: '< 48 Hours'
      }
    ];

    const escalationMatrix = proposal.escalationMatrix || [
      'Level 1 (Helpdesk): support@ibunify.com | Ticket Portal',
      'Level 2 (Technical Lead): Rama Krishna (ramakrishna@iglobus.com)',
      'Level 3 (Practice Lead): Rama Krishna (ramakrishna@iglobuscc.com)'
    ];

    return (
      <div className="proposal-pages-container sla-pages-container">
        {/* Page 1: Official Deep Royal Blue Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper sla-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Service Level Agreement (SLA)'}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-06-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.effectiveDate ? proposal.effectiveDate : (proposal.date ? proposal.date : '______________________')}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Page 2: Uptime, Benchmarks & Escalation Matrix */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · SLA Matrix & Support</span>
          </div>
          <section className="discovery-content-paper sla-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="discovery-p2-body">
                {/* Section 1 */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">1. SERVICE UPTIME & INFRASTRUCTURE COMMITMENT</h2>
                  <div className="discovery-section-text">
                    {proposal.uptimeCommitment || 'ibunify guarantees a minimum of 99.9% Platform Availability for core cloud telephony, CRM databases, and AI routing endpoints, excluding scheduled maintenance windows.'}
                  </div>
                </div>

                {/* Section 2: 4-Column Table */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">2. INCIDENT PRIORITY & TURNAROUND BENCHMARKS</h2>
                  <table className="discovery-pipeline-table">
                    <thead>
                      <tr>
                        <th style={{ width: '22%' }}>PRIORITY LEVEL</th>
                        <th style={{ width: '42%' }}>DEFINITION & IMPACT</th>
                        <th style={{ width: '18%', textAlign: 'center' }}>RESPONSE SLA</th>
                        <th style={{ width: '18%', textAlign: 'center' }}>RESOLUTION TARGET</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidentBenchmarks.map((inc, idx) => (
                        <tr key={inc.id || idx}>
                          <td style={{ fontWeight: '700', color: '#1e3a8a' }}>{inc.level}</td>
                          <td>{inc.impact}</td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#0f766e' }}>{inc.responseSla}</td>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#1e3a8a' }}>{inc.resolutionTarget}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Escalation Matrix */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">3. ESCALATION MATRIX</h2>
                  <div className="discovery-bullet-list">
                    {escalationMatrix.map((esc, idx) => (
                      <div key={idx} className="discovery-bullet-item">• {esc}</div>
                    ))}
                  </div>
                </div>

                {/* Signatory / Acknowledgment Box */}
                <div className="discovery-section-block" style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.clientSignatoryName || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.leadSignatoryName || proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.leadSignatoryTitle || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.leadSignDate ? proposal.leadSignDate : (proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>
    );
  }

  const isPo = proposal.documentType === 'po';

  if (isPo) {
    const orderScheduleItems = proposal.orderScheduleItems || [
      {
        id: 'po-item-1',
        description: 'One-Time Implementation & Setup Fee',
        qtyUnit: '1 Package',
        unitPrice: '₹50,000',
        totalAmount: '₹50,000'
      },
      {
        id: 'po-item-2',
        description: 'ibunify CRM User Licenses (Quarterly)',
        qtyUnit: '[User Count]',
        unitPrice: '₹2,500 / user / mo',
        totalAmount: 'As Per Count'
      },
      {
        id: 'po-item-3',
        description: 'WhatsApp Business Platform Setup (6 Months)',
        qtyUnit: '1 Package',
        unitPrice: '₹15,000',
        totalAmount: '₹15,000'
      },
      {
        id: 'po-item-4',
        description: 'WhatsApp Prepaid Message Wallet',
        qtyUnit: '1 Wallet',
        unitPrice: '₹10,000',
        totalAmount: '₹10,000'
      },
      {
        id: 'po-item-5',
        description: 'Cloud Telephony Virtual Numbers',
        qtyUnit: '[Qty] Nos.',
        unitPrice: '₹1,500 / no / mo',
        totalAmount: 'As Per Qty'
      }
    ];

    return (
      <div className="proposal-pages-container po-pages-container">
        {/* Page 1: Official Deep Royal Blue Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper po-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Purchase Order (PO Template)'}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-07-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.poDate ? proposal.poDate : (proposal.date ? proposal.date : '______________________')}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Page 2: PO Summary, Itemized Schedule & Dual Authorization */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · PO Summary & Schedule</span>
          </div>
          <section className="discovery-content-paper po-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="discovery-p2-body">
                {/* Section 1: Purchase Order Summary */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">1. PURCHASE ORDER SUMMARY</h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px 24px',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}>
                    <div>
                      <span style={{ color: '#64748b' }}>PO Number: </span>
                      <strong style={{ color: '#0f2b6e' }}>{proposal.poNumber || 'PO-IBUNIFY-2026-001'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Payment Terms: </span>
                      <strong style={{ color: '#0f2b6e' }}>{proposal.paymentTerms || 'NET 30'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>PO Date: </span>
                      <strong style={{ color: '#1e293b' }}>{proposal.poDate ? proposal.poDate : (proposal.date ? proposal.date : '________________________')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Currency: </span>
                      <strong style={{ color: '#1e293b' }}>{proposal.currency || 'INR (₹)'}</strong>
                    </div>
                  </div>
                </div>

                {/* Section 2: Itemized Order Schedule */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">2. ITEMIZED ORDER SCHEDULE</h2>
                  <table className="discovery-pipeline-table">
                    <thead>
                      <tr>
                        <th style={{ width: '42%' }}>ITEM DESCRIPTION</th>
                        <th style={{ width: '18%', textAlign: 'center' }}>QTY / UNIT</th>
                        <th style={{ width: '20%', textAlign: 'right' }}>UNIT PRICE (₹)</th>
                        <th style={{ width: '20%', textAlign: 'right' }}>TOTAL AMOUNT (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderScheduleItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td style={{ fontWeight: '600', color: '#1e293b' }}>{item.description}</td>
                          <td style={{ textAlign: 'center', color: '#475569' }}>{item.qtyUnit}</td>
                          <td style={{ textAlign: 'right', color: '#334155' }}>{item.unitPrice}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f2b6e' }}>{item.totalAmount}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#f0f7ff', borderTop: '2px solid #38b6ff' }}>
                        <td colSpan="3" style={{ fontWeight: '800', color: '#0f2b6e', fontSize: '11.5px' }}>
                          Total Initial Purchase Order Value (Excl. Taxes)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: '#0f2b6e', fontSize: '12px' }}>
                          {proposal.totalInitialPoValue || '₹75,000 + Users'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Authorization & Approval */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">3. AUTHORIZATION & APPROVAL</h2>
                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box', marginTop: '8px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || `ACCEPTED FOR: [${proposal.issuedByClient || proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.issuedByAuthorized || proposal.clientSignatoryName || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.issuedByDesignation || proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.issuedByDate ? proposal.issuedByDate : (proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.acceptedByAuthorized || proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.acceptedByDesignation || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.acceptedByDate ? proposal.acceptedByDate : (proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    );
  }

  const isHandover = proposal.documentType === 'handover';

  if (isHandover) {
    const checklistItems = proposal.handoverChecklistItems || [
      {
        id: 'ho-item-1',
        component: 'CRM Pipeline',
        deliveredFeature: 'Custom stages, multi-project inventory, lead scoring',
        status: 'Verified & Active'
      },
      {
        id: 'ho-item-2',
        component: 'Omnichannel Ingestion',
        deliveredFeature: 'Meta CAPI, Google Ads, portal webhooks integrated',
        status: 'Verified & Active'
      },
      {
        id: 'ho-item-3',
        component: 'Cloud Telephony',
        deliveredFeature: 'Virtual numbers configured, Call-to-Lead auto record enabled',
        status: 'Verified & Active'
      },
      {
        id: 'ho-item-4',
        component: 'WhatsApp Business',
        deliveredFeature: 'Meta API live, brochure triggers, multi-agent inbox setup',
        status: 'Verified & Active'
      },
      {
        id: 'ho-item-5',
        component: 'AI Voice Agent',
        deliveredFeature: 'Outbound dialer configured, budget qualification active',
        status: 'Verified & Active'
      },
      {
        id: 'ho-item-6',
        component: 'Documentation',
        deliveredFeature: 'Admin runbooks and user guides handed over',
        status: 'Delivered'
      }
    ];

    return (
      <div className="handover-pages-container po-pages-container">
        {/* PAGE 1: Handover Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper po-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Project Delivery & Handover Sign-off'}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || proposal.handoverSubtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || proposal.handoverClientOrg || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || proposal.handoverClientLead || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || proposal.handoverRefNo || 'IGC-IBUNIFY-08-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.handoverDate ? proposal.handoverDate : (proposal.date ? proposal.date : '______________________')}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || proposal.handoverProvider || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* PAGE 2: Handover Checklist & Formal Sign-off Matrix */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · Handover Checklist & Acceptance</span>
          </div>
          <section className="discovery-content-paper po-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="discovery-p2-body">
                {/* Section 1: Delivery Scope Verification */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">1. DELIVERY SCOPE VERIFICATION</h2>
                  <div style={{
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#334155'
                  }}>
                    {proposal.handoverScopeText || proposal.scopeVerificationText || 'This Delivery & Handover Document certifies that the implementation, configuration, user acceptance testing (UAT), and operational enablement of the iBUNIFY CRM Enterprise Suite have been completed in accordance with the agreed Statement of Work (SOW).'}
                  </div>
                </div>

                {/* Section 2: Handover Checklist & Verification */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">2. HANDOVER CHECKLIST & VERIFICATION</h2>
                  <table className="discovery-pipeline-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>COMPONENT</th>
                        <th style={{ width: '52%' }}>DELIVERED FEATURE</th>
                        <th style={{ width: '20%', textAlign: 'center' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklistItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td style={{ fontWeight: '700', color: '#0f2b6e', verticalAlign: 'top' }}>
                            {item.component}
                          </td>
                          <td style={{ color: '#334155', verticalAlign: 'top' }}>
                            {item.deliveredFeature || item.feature}
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-block',
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              fontSize: '10.5px'
                            }}>
                              {item.status || 'Verified & Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Formal Delivery Acceptance */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">3. FORMAL DELIVERY ACCEPTANCE</h2>
                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box', marginTop: '8px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || `ACCEPTED FOR: [${proposal.handoverAcceptClientOrg || proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.handoverAcceptClientName || proposal.clientSignatoryName || proposal.clientAttention || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.handoverAcceptClientTitle || proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.handoverAcceptClientDate ? proposal.handoverAcceptClientDate : (proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.handoverDeliveredLeadName || proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.handoverDeliveredLeadTitle || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.handoverDeliveredLeadDate ? proposal.handoverDeliveredLeadDate : (proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________'))}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    );
  }

  const isClosure = proposal.documentType === 'closure';

  if (isClosure) {
    const metrics = proposal.operationalMetrics || [
      { id: 'm1', value: '100%', label: 'REQUIREMENTS DELIVERED' },
      { id: 'm2', value: '100%', label: 'UAT SIGN-OFF' },
      { id: 'm3', value: '< 1 Min', label: 'AVG. RESPONSE TIME' },
      { id: 'm4', value: '24/7', label: 'SUPPORT ACTIVE' }
    ];

    return (
      <div className="closure-pages-container po-pages-container">
        {/* PAGE 1: Closure Cover Page */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 1 of 2 · Cover Page</span>
          </div>
          <section className="discovery-cover-paper po-cover-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="cover-card-inner">


                <div className="discovery-cover-main">
                  <h1 className="discovery-main-title">
                    {proposal.proposalTitle || 'Project Closure & Hypercare Transition'}
                  </h1>
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
                  </div>
                  <p className="discovery-main-description">
                    {proposal.description || proposal.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.'}
                  </p>
                </div>

                <div className="discovery-cover-bottom-meta">
                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">PREPARED FOR</div>
                    <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Company Name]'}</div>
                    <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                    <div className="discovery-meta-sub">Document Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-09-2026'}</div>
                    <div className="discovery-meta-sub">Date: {proposal.date ? proposal.date : '______________________'}</div>
                  </div>


                  <div className="discovery-meta-col">
                    <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                    <div className="discovery-meta-value-bold">{proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}</div>
                    <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                    <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                    <div className="discovery-meta-sub">{proposal.contacts || 'Product Owner: Rama Krishna | CTO'}</div>
                    <div className="discovery-meta-sub">{proposal.productLead || 'Product Lead: Ramya | Sohail'}</div>
                  </div>
                </div>

                <div className="discovery-cover-footer-brand">
                  <span>ibunify</span>
                  <small>CRM BY IGLOBUS</small>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* PAGE 2: Metrics, Transition & Mutual Sign-Off */}
        <div className="preview-page-card">
          <div className="preview-page-card-header">
            <span>Page 2 of 2 · Closure & Hypercare Details</span>
          </div>
          <section className="discovery-content-paper po-content-paper">
            <img
              src={SAMPLE_LETTERHEAD_BASE64}
              className="letterhead-bg-img"
              alt="Letterhead Background"
            />
            <div className="letterhead-content-wrap">
              <div className="discovery-p2-body">
                {/* Section 1: Formal Project Closure Statement */}
                <div className="discovery-section-block">
                  <h2 className="discovery-section-title">1. FORMAL PROJECT CLOSURE STATEMENT</h2>
                  <div style={{
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#334155'
                  }}>
                    {proposal.formalClosureStatement || `This Project Closure Certificate formally confirms that the Phase-I deployment of the ibunify CRM Platform for ${proposal.preparedFor || '[Client Company Name]'} is complete and operational.`}
                  </div>
                </div>

                {/* Section 2: Operational Metrics Achieved */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">2. OPERATIONAL METRICS ACHIEVED</h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    background: '#f8fafc',
                    padding: '16px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    {metrics.map((m, idx) => (
                      <div key={m.id || idx} style={{
                        borderRight: idx < metrics.length - 1 ? '1px solid #cbd5e1' : 'none',
                        padding: '0 6px'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0284c7', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                          {m.value}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Transition to Ongoing Support & Customer Success */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">3. TRANSITION TO ONGOING SUPPORT & CUSTOMER SUCCESS</h2>
                  <div style={{
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#334155'
                  }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      {proposal.supportTransitionText || 'The project is transitioned from the Implementation Engineering Team to the Customer Success & Managed Support Practice under the SLA terms.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#1e293b' }}>
                      <div>
                        • <strong>Support Email:</strong> {proposal.supportEmail || 'support@ibunify.com | Contact@iglobuscc.com'}
                      </div>
                      <div>
                        • <strong>Dedicated Success Manager:</strong> {proposal.dedicatedSuccessManager || 'Ramyasree (ramyasree@iglobuscc.com)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Mutual Final Project Sign-off */}
                <div className="discovery-section-block" style={{ marginTop: '14px' }}>
                  <h2 className="discovery-section-title">4. MUTUAL FINAL PROJECT SIGN-OFF</h2>
                  <div style={{ display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box', marginTop: '8px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.clientSignatoryHeader || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.clientSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.clientSignatoryName || proposal.clientAttention || '___________________________'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.clientSignatoryTitle || '____________________________'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', boxSizing: 'border-box' }}>
                      <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '12px', marginBottom: '2px' }}>
                        {proposal.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: '4px' }}>
                        {proposal.providerSignatorySub || 'Authorized Signatory'}
                      </div>
                      <div style={{ height: '42px' }}></div>
                      <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }}></div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Name: {proposal.providerSignatoryName || 'Rama Krishna'}</div>
                      <div className="sign-line" style={{ marginTop: '4px', fontSize: '11.5px', color: '#1e293b' }}>Title: {proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}</div>
                      <div className="sign-date" style={{ marginTop: '4px', fontSize: '11px', color: '#1e293b' }}>Date: {proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    );
  }

  // 5-Page Custom Proposal Renderer
  const metrics = proposal.metrics || [
    { value: '< 1 Min', label: 'FIRST RESPONSE SPEED' },
    { value: '100%', label: 'LEAD ATTRIBUTION' },
    { value: '3x', label: 'FOLLOW-UP VELOCITY' },
    { value: '24/7', label: 'AI VOICE & CHAT' }
  ];

  const servicesOverview = proposal.servicesOverview || [
    {
      key: 'A',
      title: 'Centralized Real Estate CRM',
      desc: 'Complete lead lifecycle tracking from Inquiry → Qualification → Site Visit → Negotiation → Booking & Closure.'
    },
    {
      key: 'B',
      title: 'Omnichannel Lead Ingestion',
      desc: 'Direct API ingestion from Meta Ads (CAPI), Google Ads, property portals (99acres/Housing), website forms, and walk-ins.'
    },
    {
      key: 'C',
      title: 'Closed-Loop Marketing Attribution',
      desc: 'Syncs qualified offline leads and site visits back to Google & Meta to continuously optimize ad spend and lower acquisition costs.'
    },
    {
      key: 'D',
      title: 'Executive CDR & Conversion Analytics',
      desc: 'Real-time team dashboards, call recordings, agent talk-time metrics, and pipeline conversion velocity reports.'
    }
  ];

  const aiCallingBullets = proposal.aiCallingBullets || [
    'Instant Inbound & Outbound Follow-up: Automatically dials new digital inquiries within seconds or follows up on missed calls.',
    'Intelligent Agent Handoff: Transfers hot, qualified prospects directly to human sales executives with full conversation transcripts.',
    '24/7 Availability & Multi-lingual Support: Ensures no inquiry goes unattended during late evenings, weekends, or holidays.'
  ];

  const aiCallingItems = proposal.aiCallingItems || [
    {
      id: 'ai-1',
      component: 'AI Voice Agent Engine',
      scope: 'Natural conversational voice agent, intent detection & CRM transcript sync',
      investment: 'Included in Setup'
    },
    {
      id: 'ai-2',
      component: 'AI Calling Usage',
      scope: 'Per completed incoming or outgoing conversational call',
      investment: '₹7 / call'
    }
  ];

  const cloudTelephonyBullets = proposal.cloudTelephonyBullets || [
    'Intelligent Call-to-Lead System: Inbound calls route to available agents first. Answering instantly triggers a lead profile in CRM.',
    'Dedicated Project Virtual Numbers: Assign unique tracking numbers for Meta Ads, Google Ads, hoardings, and portals.',
    'Hybrid After-Hours Routing: Automatically switches calls from the web system to sales agents\' mobile phones during non-office hours.',
    'Call Recording & CDR Analytics: Complete audit trail with secure storage, agent talk-time analytics, and disposition tagging.'
  ];

  const cloudTelephonyItems = proposal.cloudTelephonyItems || [
    {
      id: 'ct-1',
      component: 'Virtual Cloud Telephony Numbers',
      scope: 'Dedicated inbound/outbound virtual number with IVR and call recording',
      investment: '₹1,500 / Number / month'
    },
    {
      id: 'ct-2',
      component: 'Call-to-Lead Auto Ingestion Engine',
      scope: 'Real-time automatic lead record creation upon call connection',
      investment: 'Included in Setup'
    }
  ];

  const whatsappBullets = proposal.whatsappBullets || [
    'Instant Brochure & Price Sheet Dispatch: Automatically triggers WhatsApp brochures when leads submit inquiry forms.',
    'Automated Nurture Sequences: Triggers site-visit reminders, location pins, video walkthroughs, and payment milestone alerts.',
    'Unified Multi-Agent Inbox: Enables sales teams to chat with prospects from a single verified business number with full audit logs.',
    'Interactive Chatbot & Quick Replies: Pre-configured menus for instant responses to common buyer FAQs and project details.'
  ];

  const whatsappItems = proposal.whatsappItems || [
    {
      id: 'wa-1',
      component: 'WhatsApp Business Platform (API Engine)',
      scope: 'Official Meta Business API setup, template approvals & workflow engine',
      investment: '₹15,000 for 6 Months'
    },
    {
      id: 'wa-2',
      component: 'WhatsApp Message Wallet (Prepaid)',
      scope: 'Utility Message: ₹0.18 / message\nMarketing Message: ₹0.87 / message',
      investment: '₹10,000 Prepaid\n(Usage-based)'
    }
  ];

  const commercialScheduleItems = proposal.commercialScheduleItems || [
    {
      id: 'cs-1',
      component: 'One-Time Setup & Onboarding',
      scope: 'System config, Meta CAPI, Google Ads, telephony & team training',
      investment: '₹50,000 (One-Time)'
    },
    {
      id: 'cs-2',
      component: 'iBUNIFY CRM User License',
      scope: 'Full CRM pipeline, task management, mobile access & dashboards',
      investment: '₹2,500 / user / month'
    },
    {
      id: 'cs-3',
      component: 'WhatsApp Business Platform',
      scope: 'Official Meta API integration & workflow routing (6 Months)',
      investment: '₹15,000 for 6 Months'
    },
    {
      id: 'cs-4',
      component: 'WhatsApp Message Wallet',
      scope: 'Prepaid consumption (Utility: ₹0.18 | Marketing: ₹0.87)',
      investment: '₹10,000 Prepaid'
    },
    {
      id: 'cs-5',
      component: 'Cloud Telephony Virtual Numbers',
      scope: 'Per dedicated virtual number with recording & CDR logging',
      investment: '₹1,500 / Number'
    },
    {
      id: 'cs-6',
      component: 'AI Agent Calling',
      scope: 'Per connected conversational AI qualification call',
      investment: '₹7 / call'
    }
  ];

  const roadmapBullets = proposal.roadmapBullets || [
    'Week 1 (Kick-off & Ingestion): Account creation, role hierarchy setup, Meta CAPI & Google Ads integration.',
    'Week 2 (Telephony & WhatsApp): Virtual numbers provisioning, WhatsApp Business API templates, and routing logic.',
    'Week 3 (AI Agent & Testing): AI conversational script configuration, call-to-lead testing, and sandbox validation.',
    'Week 4 (Training & Go-Live): Sales team enablement, admin runbooks, UAT sign-off, and live production rollout.',
    'Support & SLA Commitment: Priority 1 (Critical) incidents resolved in < 30 minutes; dedicated Customer Success Lead.'
  ];

  const termsBullets = proposal.termsBullets || [
    'All prices are exclusive of applicable statutory GST / taxes (18%).',
    'Third-party usage (telephony minutes, WhatsApp message costs, AI calling) billed against actual wallet consumption.',
    'Invoices are payable within 30 days from date of submission (NET 30).'
  ];

  const headerLeft = proposal.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial & Services Proposal';
  const headerRight = proposal.headerRight || 'www.ibunify.com';
  const pageFootnote = proposal.pageFootnote || 'Confidential - iBUNIFY (iGLOBUS Corporate Consulting)';

  return (
    <div className="proposal-pages-container custom-proposal-pages-container">
      {/* PAGE 1: COVER PAGE */}
      <div className="preview-page-card">
        <div className="preview-page-card-header">
          <span>Page 1 of 3 · Cover Page</span>
        </div>
        <section className="discovery-cover-paper custom-proposal-cover-paper">
          <img
            src={SAMPLE_LETTERHEAD_BASE64}
            className="letterhead-bg-img"
            alt="Letterhead Background"
          />
          <div className="letterhead-content-wrap">
            <div className="cover-card-inner">
              <div className="discovery-cover-top">
                <div className="discovery-logo-wrap">
                  <div className="ibunify-logo-text">ibunify</div>
                  <div className="ibunify-sub-text">CRM BY IGLOBUS</div>
                </div>
              </div>

              <div className="discovery-cover-main">
                <div className="discovery-badge-pill">
                  {proposal.badge || 'SPECIALIZED COMMERCIAL & TECHNICAL PROPOSAL'}
                </div>
                <h1 className="discovery-main-title">
                  {proposal.proposalTitle || 'Unified CRM, Communication & AI Sales Automation'}
                </h1>
                {proposal.subtitle && (
                  <div className="discovery-main-subtitle">
                    {proposal.subtitle}
                  </div>
                )}
                <p className="discovery-main-description">
                  {proposal.description || proposal.descriptionText || 'One Platform. Every Connection. Endless Growth. Connecting Meta Ads, Google Ads, Portals, Cloud Telephony, WhatsApp Business, and Conversational AI into one cohesive pipeline.'}
                </p>
              </div>

              <div className="discovery-cover-bottom-meta">
                <div className="discovery-meta-col">
                  <div className="discovery-meta-heading">PROPOSAL PREPARED FOR</div>
                  <div className="discovery-meta-value-bold">{proposal.preparedFor || '[Client Enterprise / Jayabheri Group]'}</div>
                  <div className="discovery-meta-sub">{proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}</div>
                  <div className="discovery-meta-sub">Engagement: {proposal.engagement || 'iBUNIFY Platform & Integrated Services Deployment'}</div>
                  <div className="discovery-meta-sub">Proposal Ref: {proposal.proposalNumber || 'IGC-IBUNIFY-2026-088'}</div>
                  <div className="discovery-meta-sub">Date: {proposal.date ? proposal.date : '______________________'}</div>
                </div>

                <div className="discovery-meta-col">
                  <div className="discovery-meta-heading">SERVICE PROVIDER</div>
                  <div className="discovery-meta-value-bold">{proposal.preparedBy || proposal.company || 'iBUNIFY (iGLOBUS Corporate Consulting)'}</div>
                  <div className="discovery-meta-sub">{proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}</div>
                  <div className="discovery-meta-sub">{proposal.portals || 'Portals: www.ibunify.com | www.iglobuscc.com'}</div>
                  <div className="discovery-meta-sub">{proposal.contacts || proposal.productLead || 'Product Owner: Rama Krishna | CTO'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PAGE 2: ABOUT PRODUCT & SERVICES + AI CALLING */}
      <div className="preview-page-card">
        <div className="preview-page-card-header">
          <span>Page 2 of 3 · About Product & Services</span>
        </div>
        <section className="custom-proposal-page-paper">
          <div className="custom-proposal-watermark">iBUNIFY CRM</div>
          <div className="custom-proposal-inner">
            <div className="discovery-p2-header-top" style={{ paddingBottom: '6px', borderBottom: '1px solid #cbd5e1', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#334155', fontWeight: '500' }}>{headerLeft}</span>
              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>{headerRight}</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Section 1 */}
              <div className="discovery-section-block">
                <h2 className="discovery-section-title">1. ABOUT PRODUCT & SERVICES: THE POWER OF UNIFICATION</h2>
                <div className="discovery-section-text" style={{ marginBottom: '5px', fontSize: '10.5px', lineHeight: '1.4' }}>
                  iBUNIFY is an enterprise-grade CRM, communication, and sales automation platform engineered by iGLOBUS Corporate Consulting. Built specifically for high-velocity sales and real estate operations, iBUNIFY solves the fragmentation between disparate marketing channels, delayed lead responses, and lack of follow-up ownership.
                </div>

                <div className="ctp-callout-box" style={{ margin: '5px 0', padding: '6px 10px', fontSize: '10.5px' }}>
                  <strong>Design Principle:</strong> Connect the core before adding complexity. Ingest every lead, route every conversation instantly, automate follow-ups, and track conversions end-to-end.
                </div>

                <div className="ctp-metrics-grid" style={{ margin: '6px 0', gap: '6px' }}>
                  {metrics.map((m, idx) => (
                    <div key={idx} className="ctp-metric-card" style={{ padding: '6px 4px' }}>
                      <div className="ctp-metric-val" style={{ fontSize: '15px' }}>{m.value}</div>
                      <div className="ctp-metric-lbl" style={{ fontSize: '8px' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontWeight: '700', fontSize: '11px', color: '#0f2b6e', margin: '6px 0 3px 0' }}>
                  Integrated Platform Services Overview:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {servicesOverview.map((item) => (
                    <div key={item.key} className="ctp-breakdown-card" style={{ padding: '5px 8px', margin: 0 }}>
                      <div className="ctp-breakdown-title" style={{ fontSize: '10.5px' }}>
                        {item.key}. {item.title}
                      </div>
                      <div className="ctp-breakdown-features" style={{ fontSize: '9.5px', lineHeight: '1.3' }}>
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2 */}
              <div className="discovery-section-block" style={{ marginTop: '3px' }}>
                <h2 className="discovery-section-title">2. AI CALLING SERVICES & COSTING</h2>
                <div className="discovery-section-text" style={{ marginBottom: '3px', fontSize: '10.5px' }}>
                  iBUNIFY AI Agent Calling delivers automated, natural human-like voice conversations to qualify prospects, re-engage cold leads, and eliminate call latency:
                </div>
                <div className="discovery-bullet-list" style={{ marginBottom: '3px', gap: '1px' }}>
                  {aiCallingBullets.map((b, idx) => (
                    <div key={idx} className="discovery-bullet-item" style={{ fontSize: '9px' }}>• {b}</div>
                  ))}
                </div>
                <table className="discovery-pipeline-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32%', padding: '3px 6px', fontSize: '9.5px' }}>SERVICE COMPONENT</th>
                      <th style={{ width: '44%', padding: '3px 6px', fontSize: '9.5px' }}>SCOPE & DELIVERABLES</th>
                      <th style={{ width: '24%', padding: '3px 6px', fontSize: '9.5px', textAlign: 'right' }}>INVESTMENT (INR / ₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiCallingItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '3px 6px', fontSize: '9px' }}><strong>{item.component}</strong></td>
                        <td style={{ padding: '3px 6px', fontSize: '9px', color: '#475569' }}>{item.scope}</td>
                        <td style={{ padding: '3px 6px', fontSize: '9px', textAlign: 'right', fontWeight: '700', color: '#1e3a8a' }}>{item.investment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 3 */}
              <div className="discovery-section-block" style={{ marginTop: '3px' }}>
                <h2 className="discovery-section-title" style={{ fontSize: '10.5px', marginBottom: '2px' }}>3. CLOUD TELEPHONY SERVICES & COSTING</h2>
                <div className="discovery-section-text" style={{ marginBottom: '2px', fontSize: '9.5px' }}>
                  Enterprise cloud telephony infrastructure integrated directly into the CRM to give complete control over lead communication:
                </div>
                <div className="discovery-bullet-list" style={{ marginBottom: '3px', gap: '1px' }}>
                  {cloudTelephonyBullets.map((b, idx) => (
                    <div key={idx} className="discovery-bullet-item" style={{ fontSize: '9px' }}>• {b}</div>
                  ))}
                </div>
                <table className="discovery-pipeline-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32%', padding: '3px 6px', fontSize: '9.5px' }}>SERVICE COMPONENT</th>
                      <th style={{ width: '44%', padding: '3px 6px', fontSize: '9.5px' }}>SCOPE & DELIVERABLES</th>
                      <th style={{ width: '24%', padding: '3px 6px', fontSize: '9.5px', textAlign: 'right' }}>INVESTMENT (INR / ₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cloudTelephonyItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '3px 6px', fontSize: '9px' }}><strong>{item.component}</strong></td>
                        <td style={{ padding: '3px 6px', fontSize: '9px', color: '#475569' }}>{item.scope}</td>
                        <td style={{ padding: '3px 6px', fontSize: '9px', textAlign: 'right', fontWeight: '700', color: '#1e3a8a' }}>{item.investment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="discovery-p2-footnote" style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b' }}>
              <span>{pageFootnote}</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>Page 2 of 3</span>
            </div>
          </div>
        </section>
      </div>

      {/* PAGE 3: COMMERCIAL SCHEDULE, ROADMAP, TERMS & SIGN-OFF */}
      <div className="preview-page-card">
        <div className="preview-page-card-header">
          <span>Page 3 of 3 · Commercials, Terms & Acceptance</span>
        </div>
        <section className="custom-proposal-page-paper">
          <div className="custom-proposal-watermark">iBUNIFY CRM</div>
          <div className="custom-proposal-inner">
            <div className="discovery-p2-header-top" style={{ paddingBottom: '4px', borderBottom: '1px solid #cbd5e1', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10.5px', color: '#334155', fontWeight: '500' }}>{headerLeft}</span>
              <span style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: '600' }}>{headerRight}</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>

              {/* Section 4 */}
              <div className="discovery-section-block" style={{ marginTop: '2px' }}>
                <h2 className="discovery-section-title" style={{ fontSize: '11px', marginBottom: '2px' }}>4. WHATSAPP AUTOMATION SERVICES & COSTING</h2>
                <div className="discovery-section-text" style={{ marginBottom: '2px', fontSize: '9.5px' }}>
                  Official Meta WhatsApp Business Platform integration turning chat conversations into high-converting customer journeys:
                </div>
                <div className="discovery-bullet-list" style={{ marginBottom: '3px', gap: '1px' }}>
                  {whatsappBullets.map((b, idx) => (
                    <div key={idx} className="discovery-bullet-item" style={{ fontSize: '9px' }}>• {b}</div>
                  ))}
                </div>
                <table className="discovery-pipeline-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32%', padding: '4px 6px', fontSize: '9.5px' }}>SERVICE COMPONENT</th>
                      <th style={{ width: '44%', padding: '4px 6px', fontSize: '9.5px' }}>SCOPE & DELIVERABLES</th>
                      <th style={{ width: '24%', padding: '4px 6px', fontSize: '9.5px', textAlign: 'right' }}>INVESTMENT (INR / ₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatsappItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '3px 6px', fontSize: '9.5px' }}><strong>{item.component}</strong></td>
                        <td style={{ padding: '3px 6px', fontSize: '9px', color: '#475569', whiteSpace: 'pre-line' }}>{item.scope}</td>
                        <td style={{ padding: '3px 6px', fontSize: '9.5px', textAlign: 'right', fontWeight: '700', color: '#1e3a8a', whiteSpace: 'pre-line' }}>{item.investment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 5: Overall Commercial Investment Schedule */}
              <div className="discovery-section-block" style={{ marginTop: '2px' }}>
                <h2 className="discovery-section-title" style={{ fontSize: '11px', marginBottom: '2px' }}>5. OVERALL COMMERCIAL INVESTMENT SCHEDULE</h2>
                <table className="discovery-pipeline-table">
                  <thead>
                    <tr>
                      <th style={{ width: '34%', padding: '4px 6px', fontSize: '9.5px' }}>INVESTMENT COMPONENT</th>
                      <th style={{ width: '42%', padding: '4px 6px', fontSize: '9.5px' }}>COMMERCIAL MODEL & INCLUSIONS</th>
                      <th style={{ width: '24%', padding: '4px 6px', fontSize: '9.5px', textAlign: 'right' }}>INVESTMENT (INR / ₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commercialScheduleItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '3px 6px', fontSize: '9.5px' }}><strong>{item.component}</strong></td>
                        <td style={{ padding: '3px 6px', fontSize: '9px', color: '#475569' }}>{item.scope}</td>
                        <td style={{ padding: '3px 6px', fontSize: '9.5px', textAlign: 'right', fontWeight: '700', color: '#1e3a8a' }}>{item.investment}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f0f7ff', borderTop: '2px solid #2563eb' }}>
                      <td colSpan="2" style={{ fontWeight: '800', color: '#1e3a8a', padding: '4px 6px', fontSize: '10px' }}>
                        Base Activation Package Total (Excl. Consumption & Lic.)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#1e3a8a', padding: '4px 6px', fontSize: '10.5px' }}>
                        {proposal.baseActivationPackageTotal || proposal.basePackageTotal || '₹75,000 + Wallet / Lic.'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 6 */}
              <div className="discovery-section-block" style={{ marginTop: '8px' }}>
                <h2 className="discovery-section-title" style={{ fontSize: '11px', marginBottom: '3px' }}>6. IMPLEMENTATION ROADMAP & SLA</h2>
                <div className="discovery-bullet-list" style={{ gap: '2px' }}>
                  {roadmapBullets.map((b, idx) => (
                    <div key={idx} className="discovery-bullet-item" style={{ fontSize: '9px', lineHeight: '1.35' }}>• {b}</div>
                  ))}
                </div>
              </div>

              {/* Section 7 */}
              <div className="discovery-section-block" style={{ marginTop: '8px' }}>
                <h2 className="discovery-section-title" style={{ fontSize: '11px', marginBottom: '3px' }}>7. TERMS & CONDITIONS</h2>
                <div className="discovery-bullet-list" style={{ gap: '2px' }}>
                  {termsBullets.map((b, idx) => (
                    <div key={idx} className="discovery-bullet-item" style={{ fontSize: '9px', lineHeight: '1.35' }}>• {b}</div>
                  ))}
                </div>
              </div>

              {/* Section 8: Acceptance & Signatures */}
              <div className="discovery-section-block" style={{ marginTop: '8px' }}>
                <h2 className="discovery-section-title" style={{ fontSize: '10.5px', marginBottom: '2px' }}>8. PROPOSAL ACCEPTANCE & SIGN-OFF</h2>
                <div className="discovery-section-text" style={{ marginBottom: '4px', fontSize: '9px', color: '#334155' }}>
                  Authorized representatives acknowledge and accept the scope, deliverables, and commercial terms set forth:
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', boxSizing: 'border-box' }}>
                    <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '10px', marginBottom: '1px' }}>
                      {proposal.clientSignatoryHeader || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#64748b', marginBottom: '2px' }}>
                      {proposal.clientSignatorySub || 'Authorized Signatory'}
                    </div>
                    <div style={{ height: '22px' }}></div>
                    <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '3px' }}></div>
                    <div className="sign-line" style={{ fontSize: '9px', color: '#1e293b' }}>Name: {proposal.clientSignatoryName || '___________________________'}</div>
                    <div className="sign-line" style={{ fontSize: '9px', color: '#1e293b' }}>Title: {proposal.clientSignatoryTitle || '____________________________'}</div>
                    <div className="sign-date" style={{ fontSize: '8.5px', color: '#1e293b' }}>Date: {proposal.clientSignDate ? proposal.clientSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                  </div>

                  <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', boxSizing: 'border-box' }}>
                    <div style={{ fontWeight: '700', color: '#0f2b6e', fontSize: '10px', marginBottom: '1px' }}>
                      {proposal.providerSignatoryHeader || 'ACCEPTED FOR: iBUNIFY (iGLOBUS)'}
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#64748b', marginBottom: '2px' }}>
                      {proposal.providerSignatorySub || 'Authorized Signatory'}
                    </div>
                    <div style={{ height: '22px' }}></div>
                    <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '3px' }}></div>
                    <div className="sign-line" style={{ fontSize: '9px', color: '#1e293b' }}>Name: {proposal.providerSignatoryName || 'Rama Krishna'}</div>
                    <div className="sign-line" style={{ fontSize: '9px', color: '#1e293b' }}>Title: {proposal.providerSignatoryTitle || 'CTO'}</div>
                    <div className="sign-date" style={{ fontSize: '8.5px', color: '#1e293b' }}>Date: {proposal.providerSignDate ? proposal.providerSignDate : (proposal.date ? proposal.date : '____________________________')}</div>
                  </div>
                </div>

                <div className="discovery-corp-footer-box" style={{ marginTop: '5px', padding: '4px 8px', fontSize: '8.5px', lineHeight: '1.3' }}>
                  <div style={{ fontWeight: '700', color: '#0f2b6e' }}>{proposal.corporateFooterCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}</div>
                  <div>{proposal.corporateFooterAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'} | Contact: Rama Krishna | CTO (+91 78420 97496)</div>
                </div>
              </div>
            </div>

            <div className="discovery-p2-footnote" style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
              <span>{pageFootnote}</span>
              <span style={{ fontWeight: '600', color: '#334155' }}>Page 3 of 3</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
