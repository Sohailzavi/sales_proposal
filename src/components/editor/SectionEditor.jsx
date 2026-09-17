import React from 'react';
import { calculateCommercialTotals, calculateInvoiceTotals } from '../../services/exportService.js';

export function SectionEditor({
  proposal,
  selectedSection,
  onUpdateField,
  onUpdateSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onUpdateCommercials
}) {
  const currencySymbol = proposal.currency === 'USD' ? '$' : '₹';
  const isInvoice = proposal.documentType === 'invoice';

  if (isInvoice) {
    const items = proposal.invoiceItems || [];
    const { netSubtotal, totalDiscount, cgstAmount, sgstAmount, totalDue } = calculateInvoiceTotals(items, proposal.cgstPct, proposal.sgstPct);

    const handleAddInvoiceItem = () => {
      const newItem = {
        id: `inv-${Date.now()}`,
        description: 'New Service Line Item',
        hsnSac: 'SAC 998314',
        qty: 1,
        unit: 'hrs',
        rate: 1000,
        discountPct: 0,
        taxPct: 18
      };
      onUpdateField('invoiceItems', [...items, newItem]);
    };

    const handleUpdateInvoiceItem = (itemId, patch) => {
      const updated = items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
      onUpdateField('invoiceItems', updated);
    };

    const handleDeleteInvoiceItem = (itemId) => {
      const updated = items.filter((item) => item.id !== itemId);
      onUpdateField('invoiceItems', updated);
    };

    return (
      <section className="editor panel">
        <h2>Invoice Settings & Header</h2>

        <div className="form-grid">
          <label>
            <span>Invoice Number</span>
            <input
              value={proposal.proposalNumber || 'INV-2026-0148'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>

          <label>
            <span>Invoice Status Tag</span>
            <select
              value={proposal.invoiceStatus || 'PENDING'}
              onChange={(e) => onUpdateField('invoiceStatus', e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </label>

          <label>
            <span>Issued Date</span>
            <input
              type="date"
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
            />
          </label>

          <label>
            <span>Due Date</span>
            <input
              type="date"
              value={proposal.validUntil || ''}
              onChange={(e) => onUpdateField('validUntil', e.target.value)}
            />
          </label>

          <label>
            <span>Currency</span>
            <select
              value={proposal.currency || 'INR'}
              onChange={(e) => onUpdateField('currency', e.target.value)}
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
            </select>
          </label>
        </div>

        <h3 style={{ marginTop: '24px', fontSize: '16px', color: '#1e1b4b' }}>Company (Seller) Details</h3>
        <div className="form-grid">
          <label>
            <span>Seller Company Name</span>
            <input
              value={proposal.company || ''}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          {proposal.invoiceStyle === 'standard' ? (
            <>
              <label>
                <span>Company Logo URL</span>
                <input
                  value={proposal.companyLogoUrl || ''}
                  placeholder="https://..."
                  onChange={(e) => onUpdateField('companyLogoUrl', e.target.value)}
                />
              </label>
            </>
          ) : (
            <label>
              <span>Brand Logo Mark / Badge Text</span>
              <input
                value={proposal.companyBadge || 'NS'}
                onChange={(e) => onUpdateField('companyBadge', e.target.value)}
              />
            </label>
          )}
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Company Address</span>
            <textarea
              rows="2"
              value={proposal.companyAddress || proposal.companyMeta || ''}
              onChange={(e) => {
                onUpdateField('companyAddress', e.target.value);
                onUpdateField('companyMeta', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ marginTop: '24px', fontSize: '16px', color: '#1e1b4b' }}>Client (Bill To) Details</h3>
        <div className="form-grid">
          <label>
            <span>Bill To Client Name</span>
            <input
              value={proposal.preparedFor || ''}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
            />
          </label>
          {proposal.invoiceStyle === 'standard' && (
            <>
              <label>
                <span>Attention / Department</span>
                <input
                  value={proposal.clientAttention || ''}
                  placeholder="Attn: Priya Raman, Finance"
                  onChange={(e) => onUpdateField('clientAttention', e.target.value)}
                />
              </label>
              <label>
                <span>Client Email</span>
                <input
                  value={proposal.clientEmail || ''}
                  placeholder="accounts@example.com"
                  onChange={(e) => onUpdateField('clientEmail', e.target.value)}
                />
              </label>
            </>
          )}
          <label>
            <span>Payment Terms</span>
            <input
              value={proposal.paymentTerms || ''}
              onChange={(e) => onUpdateField('paymentTerms', e.target.value)}
            />
          </label>
          {proposal.invoiceStyle !== 'standard' && (
            <label>
              <span>Place of Supply</span>
              <input
                value={proposal.placeOfSupply || ''}
                onChange={(e) => onUpdateField('placeOfSupply', e.target.value)}
              />
            </label>
          )}
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Client Address</span>
            <textarea
              rows="2"
              value={proposal.clientAddress || ''}
              onChange={(e) => onUpdateField('clientAddress', e.target.value)}
            />
          </label>
        </div>

        <div className="structured-commercials-editor" style={{ marginTop: '24px' }}>
          <div className="commercials-editor-head">
            <h3>Invoice Line Items</h3>
            <button type="button" className="secondary sm" onClick={handleAddInvoiceItem}>＋ Add Line Item</button>
          </div>

          <table className="commercial-editor-table">
            <thead>
              <tr>
                <th>Description</th>
                {proposal.invoiceStyle === 'standard' ? (
                  <th style={{ width: '150px' }}>Detail / Subtitle</th>
                ) : (
                  <th style={{ width: '100px' }}>HSN/SAC</th>
                )}
                <th style={{ width: '70px' }}>Qty</th>
                <th style={{ width: '100px' }}>Rate</th>
                {proposal.invoiceStyle !== 'standard' && <th style={{ width: '80px' }}>Disc %</th>}
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateInvoiceItem(item.id, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    {proposal.invoiceStyle === 'standard' ? (
                      <input
                        type="text"
                        placeholder="e.g. August 2026 UI design"
                        value={item.detail || ''}
                        onChange={(e) => handleUpdateInvoiceItem(item.id, { detail: e.target.value })}
                      />
                    ) : (
                      <input
                        type="text"
                        value={item.hsnSac || ''}
                        onChange={(e) => handleUpdateInvoiceItem(item.id, { hsnSac: e.target.value })}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleUpdateInvoiceItem(item.id, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleUpdateInvoiceItem(item.id, { rate: Number(e.target.value) })}
                    />
                  </td>
                  {proposal.invoiceStyle !== 'standard' && (
                    <td>
                      <input
                        type="number"
                        value={item.discountPct || 0}
                        onChange={(e) => handleUpdateInvoiceItem(item.id, { discountPct: Number(e.target.value) })}
                      />
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      className="danger icon-sm"
                      onClick={() => handleDeleteInvoiceItem(item.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {proposal.invoiceStyle === 'standard' ? (
            <div className="commercial-summary-bar">
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="tax-label">
                  <span>CGST %</span>
                  <input
                    type="number"
                    value={typeof proposal.cgstPct === 'number' ? proposal.cgstPct : 9}
                    onChange={(e) => onUpdateField('cgstPct', Number(e.target.value))}
                  />
                </label>
                <label className="tax-label">
                  <span>SGST %</span>
                  <input
                    type="number"
                    value={typeof proposal.sgstPct === 'number' ? proposal.sgstPct : 9}
                    onChange={(e) => onUpdateField('sgstPct', Number(e.target.value))}
                  />
                </label>
              </div>
              {(() => {
                const sub = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
                const cgPct = typeof proposal.cgstPct === 'number' ? proposal.cgstPct : 9;
                const sgPct = typeof proposal.sgstPct === 'number' ? proposal.sgstPct : 9;
                const cg = (sub * cgPct) / 100;
                const sg = (sub * sgPct) / 100;
                const tot = sub + cg + sg;
                return (
                  <div className="totals-display">
                    <div>Subtotal: <strong>{currencySymbol}{sub.toLocaleString()}</strong></div>
                    <div>CGST ({cgPct}%): <strong>{currencySymbol}{cg.toLocaleString()}</strong></div>
                    <div>SGST ({sgPct}%): <strong>{currencySymbol}{sg.toLocaleString()}</strong></div>
                    <div className="grand-total-text">Total Due: <strong>{currencySymbol}{tot.toLocaleString()}</strong></div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="commercial-summary-bar">
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="tax-label">
                  <span>CGST %</span>
                  <input
                    type="number"
                    value={proposal.cgstPct || 9}
                    onChange={(e) => onUpdateField('cgstPct', Number(e.target.value))}
                  />
                </label>
                <label className="tax-label">
                  <span>SGST %</span>
                  <input
                    type="number"
                    value={proposal.sgstPct || 9}
                    onChange={(e) => onUpdateField('sgstPct', Number(e.target.value))}
                  />
                </label>
              </div>
              <div className="totals-display">
                <div>Subtotal: <strong>{currencySymbol}{(netSubtotal + totalDiscount).toLocaleString()}</strong></div>
                <div>Discount: <strong>−{currencySymbol}{totalDiscount.toLocaleString()}</strong></div>
                <div>CGST ({proposal.cgstPct || 9}%): <strong>{currencySymbol}{cgstAmount.toLocaleString()}</strong></div>
                <div>SGST ({proposal.sgstPct || 9}%): <strong>{currencySymbol}{sgstAmount.toLocaleString()}</strong></div>
                <div className="grand-total-text">Total Due: <strong>{currencySymbol}{totalDue.toLocaleString()}</strong></div>
              </div>
            </div>
          )}
        </div>

        <h3 style={{ marginTop: '24px', fontSize: '16px', color: '#1e1b4b' }}>Payment & Bank Details</h3>
        <div className="form-grid">
          <label>
            <span>Bank Name</span>
            <input
              value={proposal.bankName || ''}
              onChange={(e) => onUpdateField('bankName', e.target.value)}
            />
          </label>
          <label>
            <span>Account Number</span>
            <input
              value={proposal.accountNo || ''}
              onChange={(e) => onUpdateField('accountNo', e.target.value)}
            />
          </label>
          <label>
            <span>IFSC Code</span>
            <input
              value={proposal.ifscCode || ''}
              onChange={(e) => onUpdateField('ifscCode', e.target.value)}
            />
          </label>
          <label>
            <span>UPI Handle</span>
            <input
              value={proposal.upiId || ''}
              onChange={(e) => onUpdateField('upiId', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Invoice Notes & Payment Policy</span>
            <textarea
              rows="2"
              value={proposal.notes || ''}
              onChange={(e) => onUpdateField('notes', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  const isDiscovery = proposal.documentType === 'discovery';

  if (isDiscovery) {
    const pipelineStages = proposal.pipelineStages || [];
    const useStructuredTable = proposal.useStructuredTable !== false;

    const handleAddStage = () => {
      const newStage = {
        id: `ps-${Date.now()}`,
        stage: `Stage ${pipelineStages.length + 1}: New Pipeline Stage`,
        objective: 'Enter stage primary objective',
        action: 'Enter automated system action trigger'
      };
      onUpdateField('pipelineStages', [...pipelineStages, newStage]);
    };

    const handleUpdateStage = (stageId, patch) => {
      const updated = pipelineStages.map((st) => (st.id === stageId ? { ...st, ...patch } : st));
      onUpdateField('pipelineStages', updated);
    };

    const handleDeleteStage = (stageId) => {
      const updated = pipelineStages.filter((st) => st.id !== stageId);
      onUpdateField('pipelineStages', updated);
    };

    return (
      <section className="editor panel">
        <h2>Discovery & Scoping Settings</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '8px', marginBottom: '12px' }}>
          Cover Page & Enterprise Metadata
        </h3>
        <div className="form-grid">
          <label>
            <span>Category Badge / Eyebrow</span>
            <input
              value={proposal.badge || 'DISCOVERY — REQUIREMENT GATHERING & SCOPING'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Document Title</span>
            <input
              value={proposal.proposalTitle || 'Discovery — Requirement Gathering & Scoping'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.subtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Document Ref</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-01-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
            />
          </label>
          <label>
            <span>Client Company Name</span>
            <input
              value={proposal.preparedFor || ''}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
              placeholder="e.g. Acme Realty Pvt. Ltd."
            />
          </label>
          <label>
            <span>Client Attention / Sponsor</span>
            <input
              value={proposal.clientAttention || ''}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
              placeholder="Attn: Project Sponsor / Sales Leadership"
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Legal Governance Scope</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Document Sections (Page 2 Flow)
        </h3>
        {selectedSection ? (
          <div className="section-editor-box">
            <label>
              <span>Section Title</span>
              <input
                value={selectedSection.title || ''}
                onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
              />
            </label>
            <label style={{ marginTop: '12px' }}>
              <span>Section Content (Supports Bullet points & Markdown)</span>
              <textarea
                rows="6"
                value={selectedSection.content || ''}
                onChange={(e) => onUpdateSection(selectedSection.id, { content: e.target.value })}
              />
            </label>
          </div>
        ) : (
          <div className="form-grid">
            {(proposal.sections || []).map((sec, idx) => (
              <div key={sec.id} className="section-card-inline" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#0f2b6e', fontSize: '14px' }}>Section {idx + 1}</strong>
                </div>
                <input
                  style={{ width: '100%', marginBottom: '8px', fontWeight: '600' }}
                  value={sec.title || ''}
                  onChange={(e) => onUpdateSection(sec.id, { title: e.target.value })}
                />
                <textarea
                  rows="3"
                  style={{ width: '100%' }}
                  value={sec.content || ''}
                  onChange={(e) => onUpdateSection(sec.id, { content: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        <div className="commercial-toggle-bar" style={{ marginTop: '24px' }}>
          <div>
            <strong>Sales Hierarchy & Pipeline Stages Table</strong>
            <p>Render structured 3-column table for pipeline stages, primary objectives, and automation triggers.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={useStructuredTable}
              onChange={(e) => onUpdateField('useStructuredTable', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {useStructuredTable && (
          <div className="invoice-items-table-wrap" style={{ marginTop: '14px' }}>
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Pipeline Stage</th>
                  <th style={{ width: '32%' }}>Primary Objective</th>
                  <th style={{ width: '34%' }}>Automated System Action</th>
                  <th style={{ width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {pipelineStages.map((stage) => (
                  <tr key={stage.id}>
                    <td>
                      <input
                        value={stage.stage || ''}
                        placeholder="e.g. Stage 1: Lead Ingested"
                        onChange={(e) => handleUpdateStage(stage.id, { stage: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={stage.objective || ''}
                        placeholder="Capture prospect metadata"
                        onChange={(e) => handleUpdateStage(stage.id, { objective: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={stage.action || ''}
                        placeholder="Instant CRM record created"
                        onChange={(e) => handleUpdateStage(stage.id, { action: e.target.value })}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="del-item-btn"
                        onClick={() => handleDeleteStage(stage.id)}
                        title="Delete stage row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="add-invoice-item-btn"
              onClick={handleAddStage}
              style={{ marginTop: '10px' }}
            >
              ＋ Add Pipeline Stage
            </button>
          </div>
        )}

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '28px', marginBottom: '12px' }}>
          Sign-off & Governance Baseline
        </h3>
        <div className="form-grid">
          <label>
            <span>Client Signatory Label</span>
            <input
              value={proposal.clientSignatory || 'Client Signatory: ______________________'}
              onChange={(e) => onUpdateField('clientSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>Client Sign Date</span>
            <input
              value={proposal.clientSignDate || ''}
              onChange={(e) => onUpdateField('clientSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>ibunify Lead Signatory</span>
            <input
              value={proposal.leadSignatory || 'ibunify Lead: Rama Krishna'}
              onChange={(e) => onUpdateField('leadSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Signatory Title</span>
            <input
              value={proposal.leadSignatoryTitle || proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}
              onChange={(e) => {
                onUpdateField('leadSignatoryTitle', e.target.value);
                onUpdateField('providerSignatoryTitle', e.target.value);
              }}
            />
          </label>
          <label>
            <span>ibunify Sign Date</span>
            <input
              value={proposal.leadSignDate || ''}
              onChange={(e) => onUpdateField('leadSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Footer Company Name</span>
            <input
              value={proposal.footerCompany || 'ibunify CRM by iGLOBUS Corporate Consulting Pvt. Ltd.'}
              onChange={(e) => onUpdateField('footerCompany', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Office Address</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Websites / Portals</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  const isNda = proposal.documentType === 'nda';

  if (isNda) {
    return (
      <section className="editor panel">
        <h2>Mutual NDA Settings</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '8px', marginBottom: '12px' }}>
          Cover Page & Agreement Metadata
        </h3>
        <div className="form-grid">
          <label>
            <span>Category Badge / Eyebrow</span>
            <input
              value={proposal.badge || 'MUTUAL NON-DISCLOSURE AGREEMENT (NDA)'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Agreement Title</span>
            <input
              value={proposal.proposalTitle || 'Mutual Non-Disclosure Agreement'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.subtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Document Ref</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-02-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Effective Date</span>
            <input
              value={proposal.effectiveDate || ''}
              onChange={(e) => onUpdateField('effectiveDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Issue Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Client Company Name</span>
            <input
              value={proposal.preparedFor || ''}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
              placeholder="e.g. Acme Technologies Pvt. Ltd."
            />
          </label>
          <label>
            <span>Client Attention / Sponsor</span>
            <input
              value={proposal.clientAttention || ''}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
              placeholder="Attn: Project Sponsor / Sales Leadership"
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Legal Governance Scope</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          NDA Clauses & Sections (Page 2 Flow)
        </h3>
        {selectedSection ? (
          <div className="section-editor-box">
            <label>
              <span>Clause / Section Title</span>
              <input
                value={selectedSection.title || ''}
                onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
              />
            </label>
            <label style={{ marginTop: '12px' }}>
              <span>Clause Body Content (Supports Bullet points & Markdown)</span>
              <textarea
                rows="6"
                value={selectedSection.content || ''}
                onChange={(e) => onUpdateSection(selectedSection.id, { content: e.target.value })}
              />
            </label>
          </div>
        ) : (
          <div className="form-grid">
            {(proposal.sections || []).map((sec, idx) => (
              <div
                key={sec.id}
                className="section-card-inline"
                style={{
                  gridColumn: '1 / -1',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#0f2b6e', fontSize: '14px' }}>Clause {idx + 1}</strong>
                </div>
                <input
                  style={{ width: '100%', marginBottom: '8px', fontWeight: '600' }}
                  value={sec.title || ''}
                  onChange={(e) => onUpdateSection(sec.id, { title: e.target.value })}
                />
                <textarea
                  rows="3"
                  style={{ width: '100%' }}
                  value={sec.content || ''}
                  onChange={(e) => onUpdateSection(sec.id, { content: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '28px', marginBottom: '12px' }}>
          Execution & Sign-Off Blocks (Section 4)
        </h3>
        <div className="form-grid">
          <label>
            <span>Client Signatory Header</span>
            <input
              value={proposal.clientSignatory || 'FOR: [CLIENT COMPANY NAME]'}
              onChange={(e) => onUpdateField('clientSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>Client Signatory Name / Title</span>
            <input
              value={proposal.clientSignatoryName || ''}
              onChange={(e) => onUpdateField('clientSignatoryName', e.target.value)}
              placeholder="e.g. Managing Director / CEO"
            />
          </label>
          <label>
            <span>Client Sign Date</span>
            <input
              value={proposal.clientSignDate || ''}
              onChange={(e) => onUpdateField('clientSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>ibunify Lead Header</span>
            <input
              value={proposal.leadSignatory || 'FOR: ibunify (iGLOBUS)'}
              onChange={(e) => onUpdateField('leadSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Signatory Name</span>
            <input
              value={proposal.leadSignatoryName || 'Rama Krishna'}
              onChange={(e) => onUpdateField('leadSignatoryName', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Signatory Title</span>
            <input
              value={proposal.leadSignatoryTitle || 'Enterprise Practice Leads'}
              onChange={(e) => onUpdateField('leadSignatoryTitle', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Sign Date</span>
            <input
              value={proposal.leadSignDate || ''}
              onChange={(e) => onUpdateField('leadSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Footer Company Name</span>
            <input
              value={proposal.footerCompany || 'ibunify CRM by iGLOBUS Corporate Consulting Pvt. Ltd.'}
              onChange={(e) => onUpdateField('footerCompany', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Office Address</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Websites / Portals</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  const isMsa = proposal.documentType === 'msa';

  if (isMsa) {
    return (
      <section className="editor panel">
        <h2>Master Services Agreement (MSA) Settings</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '8px', marginBottom: '12px' }}>
          Cover Page & Master Agreement Metadata
        </h3>
        <div className="form-grid">
          <label>
            <span>Category Badge / Eyebrow</span>
            <input
              value={proposal.badge || 'MASTER SERVICES AGREEMENT (MSA)'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Agreement Title</span>
            <input
              value={proposal.proposalTitle || 'Master Services Agreement (MSA)'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.subtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Document Ref</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-04-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Effective Date</span>
            <input
              value={proposal.effectiveDate || ''}
              onChange={(e) => onUpdateField('effectiveDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Issue Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Client Company Name</span>
            <input
              value={proposal.preparedFor || ''}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
              placeholder="e.g. Acme Technologies Pvt. Ltd."
            />
          </label>
          <label>
            <span>Client Attention / Sponsor</span>
            <input
              value={proposal.clientAttention || ''}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
              placeholder="Attn: Project Sponsor / Sales Leadership"
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Legal Governance Scope</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          MSA Clauses & Framework (Page 2 Flow)
        </h3>
        {selectedSection ? (
          <div className="section-editor-box">
            <label>
              <span>Clause / Section Title</span>
              <input
                value={selectedSection.title || ''}
                onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
              />
            </label>
            <label style={{ marginTop: '12px' }}>
              <span>Clause Body Content (Supports Bullet points & Markdown)</span>
              <textarea
                rows="6"
                value={selectedSection.content || ''}
                onChange={(e) => onUpdateSection(selectedSection.id, { content: e.target.value })}
              />
            </label>
          </div>
        ) : (
          <div className="form-grid">
            {(proposal.sections || []).map((sec, idx) => (
              <div
                key={sec.id}
                className="section-card-inline"
                style={{
                  gridColumn: '1 / -1',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#0f2b6e', fontSize: '14px' }}>Clause {idx + 1}</strong>
                </div>
                <input
                  style={{ width: '100%', marginBottom: '8px', fontWeight: '600' }}
                  value={sec.title || ''}
                  onChange={(e) => onUpdateSection(sec.id, { title: e.target.value })}
                />
                <textarea
                  rows="3"
                  style={{ width: '100%' }}
                  value={sec.content || ''}
                  onChange={(e) => onUpdateSection(sec.id, { content: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '28px', marginBottom: '12px' }}>
          Execution & Sign-Off Blocks
        </h3>
        <div className="form-grid">
          <label>
            <span>Client Signatory Header</span>
            <input
              value={proposal.clientSignatory || 'FOR: [CLIENT COMPANY NAME]'}
              onChange={(e) => onUpdateField('clientSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>Client Signatory Name / Title</span>
            <input
              value={proposal.clientSignatoryName || ''}
              onChange={(e) => onUpdateField('clientSignatoryName', e.target.value)}
              placeholder="e.g. Managing Director / CEO"
            />
          </label>
          <label>
            <span>Client Sign Date</span>
            <input
              value={proposal.clientSignDate || ''}
              onChange={(e) => onUpdateField('clientSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>ibunify Lead Header</span>
            <input
              value={proposal.leadSignatory || 'FOR: ibunify (iGLOBUS)'}
              onChange={(e) => onUpdateField('leadSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Signatory Name</span>
            <input
              value={proposal.leadSignatoryName || 'Rama Krishna'}
              onChange={(e) => onUpdateField('leadSignatoryName', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Signatory Title</span>
            <input
              value={proposal.leadSignatoryTitle || 'Enterprise Practice Leads'}
              onChange={(e) => onUpdateField('leadSignatoryTitle', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Sign Date</span>
            <input
              value={proposal.leadSignDate || ''}
              onChange={(e) => onUpdateField('leadSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Footer Company Name</span>
            <input
              value={proposal.footerCompany || 'ibunify CRM by iGLOBUS Corporate Consulting Pvt. Ltd.'}
              onChange={(e) => onUpdateField('footerCompany', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Office Address</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Websites / Portals</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  const isCommercialProposal = proposal.documentType === 'commercial_proposal';

  if (isCommercialProposal) {
    const metrics = proposal.metrics || [];
    const serviceBreakdown = proposal.serviceBreakdown || [];
    const commercialScheduleItems = proposal.commercialScheduleItems || [];
    const sowScopeActivities = proposal.sowScopeActivities || [];
    const sowDeliverables = proposal.sowDeliverables || [];
    const sowTimelineMilestones = proposal.sowTimelineMilestones || [];
    const sowInvoicingMilestones = proposal.sowInvoicingMilestones || [];
    const sowAssumptions = proposal.sowAssumptions || [];

    return (
      <section className="editor panel">
        <h2>Statement of Work (SOW) Settings</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '8px', marginBottom: '12px' }}>
          Cover Page & Engagement Metadata (Page 1)
        </h3>
        <div className="form-grid">
          <label>
            <span>Category Badge / Pill</span>
            <input
              value={proposal.badge || 'STANDARD COMMERCIAL PROPOSAL & STATEMENT OF WORK'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Proposal Title</span>
            <input
              value={proposal.proposalTitle || 'Unified CRM, Communication & AI Sales Automation'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.subtitle || 'Built for High-Velocity Real Estate & Sales Enterprises'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Document Ref</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-05-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>SOW Ref</span>
            <input
              value={proposal.sowNumber || 'IGC-ibunify-SOW-2026'}
              onChange={(e) => onUpdateField('sowNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Proposal Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Effective Date</span>
            <input
              value={proposal.effectiveDate || ''}
              onChange={(e) => onUpdateField('effectiveDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Engagement Scope</span>
            <input
              value={proposal.engagement || 'ibunify CRM & Automation Platform Deployment'}
              onChange={(e) => onUpdateField('engagement', e.target.value)}
            />
          </label>
          <label>
            <span>Client Company Name</span>
            <input
              value={proposal.preparedFor || '[Client Company Name]'}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
              placeholder="e.g. [Client Company Name]"
            />
          </label>
          <label>
            <span>Client Attention / Sponsor</span>
            <input
              value={proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
              placeholder="Attn: Project Sponsor / Sales Leadership"
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Philosophy Statement</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Key Metrics Highlights (Page 2)
        </h3>
        <div className="form-grid">
          {metrics.map((m, mIdx) => (
            <div key={mIdx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label>
                <span style={{ fontSize: '11px' }}>Metric Value</span>
                <input
                  value={m.value}
                  onChange={(e) => {
                    const next = [...metrics];
                    next[mIdx] = { ...next[mIdx], value: e.target.value };
                    onUpdateField('metrics', next);
                  }}
                />
              </label>
              <label style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '11px' }}>Metric Label</span>
                <input
                  value={m.label}
                  onChange={(e) => {
                    const next = [...metrics];
                    next[mIdx] = { ...next[mIdx], label: e.target.value };
                    onUpdateField('metrics', next);
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Section 2: Granular Service Breakdown & Costing (Page 2)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {serviceBreakdown.map((item, idx) => (
            <div key={item.key || idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label>
                <span>{item.key}. Service Pillar Title</span>
                <input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...serviceBreakdown];
                    next[idx] = { ...next[idx], title: e.target.value };
                    onUpdateField('serviceBreakdown', next);
                  }}
                />
              </label>
              <label style={{ marginTop: '8px' }}>
                <span>Core Features Scope</span>
                <textarea
                  rows="3"
                  value={item.features}
                  onChange={(e) => {
                    const next = [...serviceBreakdown];
                    next[idx] = { ...next[idx], features: e.target.value };
                    onUpdateField('serviceBreakdown', next);
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Section 3: Overall Costing & Commercial Schedule (Page 2 & 3)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {commercialScheduleItems.map((item, idx) => (
            <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
              <input
                value={item.component}
                placeholder="Service Component"
                onChange={(e) => {
                  const next = [...commercialScheduleItems];
                  next[idx] = { ...next[idx], component: e.target.value };
                  onUpdateField('commercialScheduleItems', next);
                }}
              />
              <input
                value={item.scope}
                placeholder="Scope & Deliverables"
                onChange={(e) => {
                  const next = [...commercialScheduleItems];
                  next[idx] = { ...next[idx], scope: e.target.value };
                  onUpdateField('commercialScheduleItems', next);
                }}
              />
              <input
                value={item.investment}
                placeholder="Investment (₹)"
                onChange={(e) => {
                  const next = [...commercialScheduleItems];
                  next[idx] = { ...next[idx], investment: e.target.value };
                  onUpdateField('commercialScheduleItems', next);
                }}
              />
            </div>
          ))}
          <label style={{ marginTop: '8px' }}>
            <span>Base Activation Package Total</span>
            <input
              value={proposal.basePackageTotal || '₹75,000 + Wallet / Lic.'}
              onChange={(e) => onUpdateField('basePackageTotal', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '28px', marginBottom: '12px' }}>
          Part 2: Statement of Work (SOW) Settings (Page 4 & 5)
        </h3>
        <label>
          <span>SOW Preamble</span>
          <textarea
            rows="3"
            value={proposal.sowPreamble || ''}
            onChange={(e) => onUpdateField('sowPreamble', e.target.value)}
          />
        </label>

        <h4 style={{ fontSize: '13px', color: '#1e3a8a', marginTop: '16px', marginBottom: '8px' }}>
          1. Scope Activities (5 Bullets)
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sowScopeActivities.map((act, idx) => (
            <textarea
              key={idx}
              rows="2"
              value={act}
              onChange={(e) => {
                const next = [...sowScopeActivities];
                next[idx] = e.target.value;
                onUpdateField('sowScopeActivities', next);
              }}
            />
          ))}
        </div>

        <h4 style={{ fontSize: '13px', color: '#1e3a8a', marginTop: '16px', marginBottom: '8px' }}>
          2. Deliverables Matrix (4 Bullets)
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sowDeliverables.map((del, idx) => (
            <input
              key={idx}
              value={del}
              onChange={(e) => {
                const next = [...sowDeliverables];
                next[idx] = e.target.value;
                onUpdateField('sowDeliverables', next);
              }}
            />
          ))}
        </div>

        <h4 style={{ fontSize: '13px', color: '#1e3a8a', marginTop: '16px', marginBottom: '8px' }}>
          3. Timeline Schedule (Gantt Matrix)
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sowTimelineMilestones.map((m, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
              <input
                value={m.activity}
                onChange={(e) => {
                  const next = [...sowTimelineMilestones];
                  next[idx] = { ...next[idx], activity: e.target.value };
                  onUpdateField('sowTimelineMilestones', next);
                }}
              />
              <select
                value={m.activeWeek}
                onChange={(e) => {
                  const next = [...sowTimelineMilestones];
                  next[idx] = { ...next[idx], activeWeek: Number(e.target.value) };
                  onUpdateField('sowTimelineMilestones', next);
                }}
              >
                <option value={1}>Active in Week 1</option>
                <option value={2}>Active in Week 2</option>
                <option value={3}>Active in Week 3</option>
                <option value={4}>Active in Week 4</option>
              </select>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: '13px', color: '#1e3a8a', marginTop: '16px', marginBottom: '8px' }}>
          4. Milestone Invoicing Schedule
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sowInvoicingMilestones.map((inv, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
              <input
                value={inv.deliverable}
                onChange={(e) => {
                  const next = [...sowInvoicingMilestones];
                  next[idx] = { ...next[idx], deliverable: e.target.value };
                  onUpdateField('sowInvoicingMilestones', next);
                }}
              />
              <input
                value={inv.percentage}
                onChange={(e) => {
                  const next = [...sowInvoicingMilestones];
                  next[idx] = { ...next[idx], percentage: e.target.value };
                  onUpdateField('sowInvoicingMilestones', next);
                }}
              />
              <input
                value={inv.amount}
                onChange={(e) => {
                  const next = [...sowInvoicingMilestones];
                  next[idx] = { ...next[idx], amount: e.target.value };
                  onUpdateField('sowInvoicingMilestones', next);
                }}
              />
            </div>
          ))}
          <label style={{ marginTop: '6px' }}>
            <span>Total Base Implementation Fee</span>
            <input
              value={proposal.totalImplementationFee || '₹50,000'}
              onChange={(e) => onUpdateField('totalImplementationFee', e.target.value)}
            />
          </label>
        </div>

        <h4 style={{ fontSize: '13px', color: '#1e3a8a', marginTop: '16px', marginBottom: '8px' }}>
          5. Engagement Assumptions & SLAs
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sowAssumptions.map((assump, idx) => (
            <textarea
              key={idx}
              rows="2"
              value={assump}
              onChange={(e) => {
                const next = [...sowAssumptions];
                next[idx] = e.target.value;
                onUpdateField('sowAssumptions', next);
              }}
            />
          ))}
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '28px', marginBottom: '12px' }}>
          Section 6: Authorization & Sign-Off (Page 5)
        </h3>
        <div className="form-grid">
          <label>
            <span>Client Signatory Name</span>
            <input
              value={proposal.clientSignatoryName || ''}
              onChange={(e) => onUpdateField('clientSignatoryName', e.target.value)}
              placeholder="e.g. Authorized Signatory"
            />
          </label>
          <label>
            <span>Client Signatory Title</span>
            <input
              value={proposal.clientSignatoryTitle || ''}
              onChange={(e) => onUpdateField('clientSignatoryTitle', e.target.value)}
              placeholder="e.g. Director / Managing Partner"
            />
          </label>
          <label>
            <span>Client Sign Date</span>
            <input
              value={proposal.clientSignDate || ''}
              onChange={(e) => onUpdateField('clientSignDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>ibunify Lead Signatory</span>
            <input
              value={proposal.leadSignatoryName || 'Rama Krishna'}
              onChange={(e) => onUpdateField('leadSignatoryName', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Signatory Title</span>
            <input
              value={proposal.leadSignatoryTitle || 'Enterprise Practice Leads'}
              onChange={(e) => onUpdateField('leadSignatoryTitle', e.target.value)}
            />
          </label>
          <label>
            <span>ibunify Sign Date</span>
            <input
              value={proposal.providerSignDate || proposal.leadSignDate || ''}
              onChange={(e) => {
                onUpdateField('providerSignDate', e.target.value);
                onUpdateField('leadSignDate', e.target.value);
              }}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
        </div>
      </section>
    );
  }

  const isSla = proposal.documentType === 'sla';

  if (isSla) {
    const incidentBenchmarks = proposal.incidentBenchmarks || [];
    const escalationMatrix = proposal.escalationMatrix || [];

    const handleUpdateBenchmark = (idx, patch) => {
      const updated = [...incidentBenchmarks];
      updated[idx] = { ...updated[idx], ...patch };
      onUpdateField('incidentBenchmarks', updated);
    };

    const handleUpdateEscalation = (idx, value) => {
      const updated = [...escalationMatrix];
      updated[idx] = value;
      onUpdateField('escalationMatrix', updated);
    };

    return (
      <section className="editor panel">
        <h2>Service Level Agreement (SLA) Settings</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '8px', marginBottom: '12px' }}>
          Cover Page & SLA Metadata (Page 1)
        </h3>
        <div className="form-grid">
          <label>
            <span>Category Badge / Pill</span>
            <input
              value={proposal.badge || 'SERVICE LEVEL AGREEMENT (SLA)'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Agreement Title</span>
            <input
              value={proposal.proposalTitle || 'Service Level Agreement (SLA)'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.subtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Document Ref</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-06-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Issue Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Client Company Name</span>
            <input
              value={proposal.preparedFor || ''}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
              placeholder="e.g. [Client Company Name]"
            />
          </label>
          <label>
            <span>Client Attention / Sponsor</span>
            <input
              value={proposal.clientAttention || ''}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
              placeholder="Attn: Project Sponsor / Sales Leadership"
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Digital Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Governance Statement</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          1. Service Uptime & Infrastructure Commitment
        </h3>
        <div className="form-grid">
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Platform Availability Commitment Text</span>
            <textarea
              rows="3"
              value={proposal.uptimeCommitment || 'ibunify guarantees a minimum of 99.9% Platform Availability for core cloud telephony, CRM databases, and AI routing endpoints, excluding scheduled maintenance windows.'}
              onChange={(e) => onUpdateField('uptimeCommitment', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          2. Incident Priority & Turnaround Benchmarks (4-Column Matrix)
        </h3>
        <div className="invoice-items-table-wrap">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Priority Level</th>
                <th style={{ width: '42%' }}>Definition & Impact</th>
                <th style={{ width: '18%' }}>Response SLA</th>
                <th style={{ width: '18%' }}>Resolution Target</th>
              </tr>
            </thead>
            <tbody>
              {incidentBenchmarks.map((inc, idx) => (
                <tr key={inc.id || idx}>
                  <td>
                    <input
                      style={{ fontWeight: '700' }}
                      value={inc.level || ''}
                      onChange={(e) => handleUpdateBenchmark(idx, { level: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={inc.impact || ''}
                      onChange={(e) => handleUpdateBenchmark(idx, { impact: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={inc.responseSla || ''}
                      onChange={(e) => handleUpdateBenchmark(idx, { responseSla: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={inc.resolutionTarget || ''}
                      onChange={(e) => handleUpdateBenchmark(idx, { resolutionTarget: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          3. Escalation Matrix (Tiers 1 to 3)
        </h3>
        <div className="form-grid">
          {escalationMatrix.map((esc, idx) => (
            <label key={idx} className="full-width-label" style={{ gridColumn: '1 / -1' }}>
              <span>Level {idx + 1} Escalation</span>
              <input
                value={esc}
                onChange={(e) => handleUpdateEscalation(idx, e.target.value)}
              />
            </label>
          ))}
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Acknowledgment & Corporate Details
        </h3>
        <div className="form-grid">
          <label>
            <span>Client Acknowledgment Line</span>
            <input
              value={proposal.clientAcknowledgment || 'Client Acknowledgment: ___________________'}
              onChange={(e) => onUpdateField('clientAcknowledgment', e.target.value)}
            />
          </label>
          <label>
            <span>Service Provider Signatory</span>
            <input
              value={proposal.leadSignatory || 'ibunify Success Lead: Ramyasree'}
              onChange={(e) => onUpdateField('leadSignatory', e.target.value)}
            />
          </label>
          <label>
            <span>Service Provider Signatory Title</span>
            <input
              value={proposal.leadSignatoryTitle || 'Enterprise Practice Leads'}
              onChange={(e) => onUpdateField('leadSignatoryTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Company Name</span>
            <input
              value={proposal.footerCompany || 'ibunify CRM by iGLOBUS Corporate Consulting Pvt. Ltd.'}
              onChange={(e) => onUpdateField('footerCompany', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Office Address</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Portals</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
        </div>
      </section>
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

    const handleUpdateOrderItem = (index, patch) => {
      const updated = [...orderScheduleItems];
      updated[index] = { ...updated[index], ...patch };
      onUpdateField('orderScheduleItems', updated);
    };

    const handleDeleteOrderItem = (index) => {
      const updated = orderScheduleItems.filter((_, idx) => idx !== index);
      onUpdateField('orderScheduleItems', updated);
    };

    const handleAddOrderItem = () => {
      const newItem = {
        id: `po-item-${Date.now()}`,
        description: 'New Service Component',
        qtyUnit: '1 Package',
        unitPrice: '₹0',
        totalAmount: '₹0'
      };
      onUpdateField('orderScheduleItems', [...orderScheduleItems, newItem]);
    };

    return (
      <section className="editor panel invoice-editor">
        <h2>Purchase Order (PO Template) Customizer</h2>

        <div className="form-grid">
          <label>
            <span>Document Badge / Label</span>
            <input
              value={proposal.badge || 'PURCHASE ORDER (PO TEMPLATE)'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Document Title</span>
            <input
              value={proposal.proposalTitle || 'Purchase Order (PO Template)'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle</span>
            <input
              value={proposal.subtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Document Reference ID</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-07-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Document Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Client / Prepared For</span>
            <input
              value={proposal.preparedFor || '[Client Company Name]'}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
            />
          </label>
          <label>
            <span>Attention</span>
            <input
              value={proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Digital Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Handover Statement</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          1. Purchase Order Summary
        </h3>
        <div className="form-grid">
          <label>
            <span>PO Number</span>
            <input
              value={proposal.poNumber || 'PO-ibunify-2026-001'}
              onChange={(e) => onUpdateField('poNumber', e.target.value)}
            />
          </label>
          <label>
            <span>PO Date</span>
            <input
              value={proposal.poDate || ''}
              onChange={(e) => onUpdateField('poDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Payment Terms</span>
            <input
              value={proposal.paymentTerms || 'NET 30'}
              onChange={(e) => onUpdateField('paymentTerms', e.target.value)}
            />
          </label>
          <label>
            <span>Currency</span>
            <input
              value={proposal.currency || 'INR (₹)'}
              onChange={(e) => onUpdateField('currency', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          2. Itemized Order Schedule (4 Columns)
        </h3>
        <div className="invoice-items-table-wrap">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Item Description</th>
                <th style={{ width: '20%' }}>Qty / Unit</th>
                <th style={{ width: '20%' }}>Unit Price</th>
                <th style={{ width: '16%' }}>Total Amount</th>
                <th style={{ width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {orderScheduleItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>
                    <input
                      style={{ fontWeight: '600' }}
                      value={item.description || ''}
                      onChange={(e) => handleUpdateOrderItem(idx, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={item.qtyUnit || ''}
                      onChange={(e) => handleUpdateOrderItem(idx, { qtyUnit: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={item.unitPrice || ''}
                      onChange={(e) => handleUpdateOrderItem(idx, { unitPrice: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      style={{ fontWeight: '700' }}
                      value={item.totalAmount || ''}
                      onChange={(e) => handleUpdateOrderItem(idx, { totalAmount: e.target.value })}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="del-item-btn"
                      onClick={() => handleDeleteOrderItem(idx)}
                      title="Delete item"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="add-invoice-item-btn"
            onClick={handleAddOrderItem}
            style={{ marginTop: '10px' }}
          >
            ＋ Add Order Item
          </button>
        </div>

        <div className="form-grid" style={{ marginTop: '14px' }}>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Total Initial Purchase Order Value (Excl. Taxes)</span>
            <input
              style={{ fontWeight: '700', color: '#0f2b6e' }}
              value={proposal.totalInitialPoValue || '₹75,000 + Users'}
              onChange={(e) => onUpdateField('totalInitialPoValue', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          3. Authorization & Approval
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>Issued By (Client)</strong>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Client Entity Name</span>
              <input
                value={proposal.issuedByClient || '[CLIENT COMPANY NAME]'}
                onChange={(e) => onUpdateField('issuedByClient', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Authorized By</span>
              <input
                value={proposal.issuedByAuthorized || '__________________________'}
                onChange={(e) => onUpdateField('issuedByAuthorized', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Designation</span>
              <input
                value={proposal.issuedByDesignation || '____________________________'}
                onChange={(e) => onUpdateField('issuedByDesignation', e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
              <input
                value={proposal.issuedByDate || ''}
                onChange={(e) => onUpdateField('issuedByDate', e.target.value)}
                placeholder="e.g. 2026-09-15 (leave blank for line)"
              />
            </label>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>Accepted By (Service Provider)</strong>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Service Provider Entity</span>
              <input
                value={proposal.acceptedByCompany || 'iGLOBUS Corporate Consulting Pvt. Ltd.'}
                onChange={(e) => onUpdateField('acceptedByCompany', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Authorized By</span>
              <input
                value={proposal.acceptedByAuthorized || 'Rama Krishna'}
                onChange={(e) => onUpdateField('acceptedByAuthorized', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Designation</span>
              <input
                value={proposal.acceptedByDesignation || 'Enterprise Practice Leads'}
                onChange={(e) => onUpdateField('acceptedByDesignation', e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
              <input
                value={proposal.acceptedByDate || ''}
                onChange={(e) => onUpdateField('acceptedByDate', e.target.value)}
                placeholder="e.g. 2026-09-15 (leave blank for line)"
              />
            </label>
          </div>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Corporate Office & Footer
        </h3>
        <div className="form-grid">
          <label>
            <span>Footer Company Name</span>
            <input
              value={proposal.footerCompany || 'ibunify CRM by iGLOBUS Corporate Consulting Pvt. Ltd.'}
              onChange={(e) => onUpdateField('footerCompany', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Office Address</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Portals</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
          <label>
            <span>Running Page Footnote</span>
            <input
              value={proposal.pageFootnote || 'ibunify (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com'}
              onChange={(e) => onUpdateField('pageFootnote', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  const isHandover = proposal.documentType === 'handover';

  if (isHandover) {
    const checklistItems = proposal.handoverChecklistItems || [];

    const handleAddChecklistItem = () => {
      const newItem = {
        id: `ho-${Date.now()}`,
        component: 'New Component',
        feature: 'Delivered capability and verification description',
        status: 'Completed & Verified'
      };
      onUpdateField('handoverChecklistItems', [...checklistItems, newItem]);
    };

    const handleUpdateChecklistItem = (index, patch) => {
      const updated = checklistItems.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
      onUpdateField('handoverChecklistItems', updated);
    };

    const handleDeleteChecklistItem = (index) => {
      const updated = checklistItems.filter((_, idx) => idx !== index);
      onUpdateField('handoverChecklistItems', updated);
    };

    return (
      <section className="editor panel">
        <h2>Project Delivery & Handover Sign-off Customizer</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '16px', marginBottom: '12px' }}>
          Document Header & Cover Details
        </h3>
        <div className="form-grid">
          <label>
            <span>Document Title</span>
            <input
              value={proposal.proposalTitle || 'Project Delivery & Handover Sign-off'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.handoverSubtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('handoverSubtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Reference Number</span>
            <input
              value={proposal.handoverRefNo || 'IGC-ibunify-08-2026'}
              onChange={(e) => onUpdateField('handoverRefNo', e.target.value)}
            />
          </label>
          <label>
            <span>Document / Delivery Date</span>
            <input
              value={proposal.handoverDate || ''}
              onChange={(e) => onUpdateField('handoverDate', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Client Project Lead</span>
            <input
              value={proposal.handoverClientLead || 'Rama Krishna'}
              onChange={(e) => onUpdateField('handoverClientLead', e.target.value)}
            />
          </label>
          <label>
            <span>Client Organization</span>
            <input
              value={proposal.handoverClientOrg || '[CLIENT ORGANIZATION]'}
              onChange={(e) => onUpdateField('handoverClientOrg', e.target.value)}
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.handoverProvider || 'iGLOBUS Corporate Consulting Pvt. Ltd.'}
              onChange={(e) => onUpdateField('handoverProvider', e.target.value)}
            />
          </label>
          <label>
            <span>Solution Architect / Delivery Lead</span>
            <input
              value={proposal.handoverProviderLead || 'Sohail'}
              onChange={(e) => onUpdateField('handoverProviderLead', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          1. Delivery Scope Verification
        </h3>
        <label style={{ display: 'block', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Scope Verification Statement</span>
          <textarea
            rows="3"
            value={proposal.handoverScopeText || 'This Delivery & Handover Document certifies that the implementation of the ibunify CRM Platform has been completed in accordance with the Statement of Work.'}
            onChange={(e) => onUpdateField('handoverScopeText', e.target.value)}
          />
        </label>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          2. Handover Checklist & Verification Matrix
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="customizer-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f2b6e', color: '#fff' }}>
                <th style={{ width: '28%' }}>Component</th>
                <th style={{ width: '44%' }}>Delivered Feature</th>
                <th style={{ width: '22%' }}>Status</th>
                <th style={{ width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {checklistItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>
                    <input
                      style={{ fontWeight: '600' }}
                      value={item.component || ''}
                      onChange={(e) => handleUpdateChecklistItem(idx, { component: e.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      rows="2"
                      value={item.feature || ''}
                      onChange={(e) => handleUpdateChecklistItem(idx, { feature: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      style={{ fontWeight: '600', color: '#047857' }}
                      value={item.status || ''}
                      onChange={(e) => handleUpdateChecklistItem(idx, { status: e.target.value })}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="del-item-btn"
                      onClick={() => handleDeleteChecklistItem(idx)}
                      title="Delete checklist item"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="add-invoice-item-btn"
            onClick={handleAddChecklistItem}
            style={{ marginTop: '10px' }}
          >
            ＋ Add Checklist Item
          </button>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          3. Formal Delivery Acceptance (Dual Sign-Off)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>Accepted by (Client Project Manager)</strong>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Name</span>
              <input
                value={proposal.handoverAcceptClientName || 'Rama Krishna'}
                onChange={(e) => onUpdateField('handoverAcceptClientName', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Designation / Title</span>
              <input
                value={proposal.handoverAcceptClientTitle || 'Project Manager / Delivery Sponsor'}
                onChange={(e) => onUpdateField('handoverAcceptClientTitle', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Organization</span>
              <input
                value={proposal.handoverAcceptClientOrg || '[CLIENT ORGANIZATION]'}
                onChange={(e) => onUpdateField('handoverAcceptClientOrg', e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
              <input
                value={proposal.handoverAcceptClientDate || ''}
                onChange={(e) => {
                  onUpdateField('handoverAcceptClientDate', e.target.value);
                  onUpdateField('acceptedDate', e.target.value);
                }}
                placeholder="e.g. 2026-09-15 (leave blank for line)"
              />
            </label>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>Delivered by (ibunify Lead)</strong>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Name</span>
              <input
                value={proposal.handoverDeliveredLeadName || 'Sohail'}
                onChange={(e) => onUpdateField('handoverDeliveredLeadName', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Designation / Title</span>
              <input
                value={proposal.handoverDeliveredLeadTitle || 'Enterprise Practice Leads'}
                onChange={(e) => onUpdateField('handoverDeliveredLeadTitle', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Organization</span>
              <input
                value={proposal.handoverDeliveredLeadOrg || 'iGLOBUS Corporate Consulting Pvt. Ltd.'}
                onChange={(e) => onUpdateField('handoverDeliveredLeadOrg', e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
              <input
                value={proposal.handoverDeliveredLeadDate || ''}
                onChange={(e) => {
                  onUpdateField('handoverDeliveredLeadDate', e.target.value);
                  onUpdateField('deliveredDate', e.target.value);
                }}
                placeholder="e.g. 2026-09-15 (leave blank for line)"
              />
            </label>
          </div>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Corporate Office & Footer
        </h3>
        <div className="form-grid">
          <label>
            <span>Footer Registered Office</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Websites</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
          <label>
            <span>Running Page Footnote</span>
            <input
              value={proposal.pageFootnote || 'ibunify (iGLOBUS Corporate Consulting Pvt. Ltd.) | Project Delivery Sign-off'}
              onChange={(e) => onUpdateField('pageFootnote', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  const isClosure = proposal.documentType === 'closure';

  if (isClosure) {
    const metrics = proposal.operationalMetrics || [
      { id: 'metric-1', value: '100%', label: 'REQUIREMENTS DELIVERED' },
      { id: 'metric-2', value: '100%', label: 'UAT SIGN-OFF' },
      { id: 'metric-3', value: '< 1 Min', label: 'AVG. RESPONSE TIME' },
      { id: 'metric-4', value: '24/7', label: 'SUPPORT ACTIVE' }
    ];

    const handleUpdateMetric = (index, patch) => {
      const updated = metrics.map((m, idx) => (idx === index ? { ...m, ...patch } : m));
      onUpdateField('operationalMetrics', updated);
    };

    return (
      <section className="editor panel">
        <h2>Project Closure & Hypercare Transition Customizer</h2>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '16px', marginBottom: '12px' }}>
          Document Header & Cover Details (Page 1)
        </h3>
        <div className="form-grid">
          <label>
            <span>Document Title</span>
            <input
              value={proposal.proposalTitle || 'Project Closure & Hypercare Transition'}
              onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
            />
          </label>
          <label>
            <span>Subtitle / Platform</span>
            <input
              value={proposal.subtitle || 'ibunify CRM by iGLOBUS Corporate Consulting'}
              onChange={(e) => onUpdateField('subtitle', e.target.value)}
            />
          </label>
          <label>
            <span>Category Badge / Pill</span>
            <input
              value={proposal.badge || 'PROJECT CLOSURE & HYPERCARE TRANSITION'}
              onChange={(e) => onUpdateField('badge', e.target.value)}
            />
          </label>
          <label>
            <span>Document Ref</span>
            <input
              value={proposal.proposalNumber || 'IGC-ibunify-09-2026'}
              onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
            />
          </label>
          <label>
            <span>Date</span>
            <input
              value={proposal.date || ''}
              onChange={(e) => onUpdateField('date', e.target.value)}
              placeholder="e.g. 2026-09-15 (leave blank for line)"
            />
          </label>
          <label>
            <span>Client / Prepared For</span>
            <input
              value={proposal.preparedFor || '[Client Company Name]'}
              onChange={(e) => onUpdateField('preparedFor', e.target.value)}
            />
          </label>
          <label>
            <span>Attention</span>
            <input
              value={proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}
              onChange={(e) => onUpdateField('clientAttention', e.target.value)}
            />
          </label>
          <label>
            <span>Service Provider</span>
            <input
              value={proposal.company || 'ibunify (iGLOBUS Corporate Consulting)'}
              onChange={(e) => onUpdateField('company', e.target.value)}
            />
          </label>
          <label>
            <span>Office Location</span>
            <input
              value={proposal.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
              onChange={(e) => onUpdateField('companyAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Digital Portals</span>
            <input
              value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('portals', e.target.value)}
            />
          </label>
          <label>
            <span>Product Owner</span>
            <input
              value={proposal.contacts || 'Product Owner: Rama Krishna | CTO'}
              onChange={(e) => onUpdateField('contacts', e.target.value)}
            />
          </label>
          <label>
            <span>Product Lead</span>
            <input
              value={proposal.productLead || 'Product Lead: Ramya | Sohail'}
              onChange={(e) => onUpdateField('productLead', e.target.value)}
            />
          </label>
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Overview & Governance Statement</span>
            <textarea
              rows="2"
              value={proposal.description || proposal.descriptionText || ''}
              onChange={(e) => {
                onUpdateField('description', e.target.value);
                onUpdateField('descriptionText', e.target.value);
              }}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          1. Formal Project Closure Statement
        </h3>
        <label style={{ display: 'block', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Closure Confirmation Text</span>
          <textarea
            rows="3"
            value={proposal.formalClosureStatement || `This Project Closure Certificate formally confirms that the Phase-I deployment of the ibunify CRM Platform for ${proposal.preparedFor || '[Client Company Name]'} is complete and operational.`}
            onChange={(e) => onUpdateField('formalClosureStatement', e.target.value)}
          />
        </label>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          2. Operational Metrics Achieved (4 Cards)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {metrics.map((m, idx) => (
            <div key={m.id || idx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Metric Value</span>
                <input
                  style={{ fontWeight: '800', color: '#0284c7', fontSize: '16px' }}
                  value={m.value || ''}
                  onChange={(e) => handleUpdateMetric(idx, { value: e.target.value })}
                />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Metric Label</span>
                <input
                  style={{ fontSize: '11px', fontWeight: '700' }}
                  value={m.label || ''}
                  onChange={(e) => handleUpdateMetric(idx, { label: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          3. Transition to Ongoing Support & Customer Success
        </h3>
        <div className="form-grid">
          <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
            <span>Transition Statement</span>
            <textarea
              rows="2"
              value={proposal.supportTransitionText || 'The project is transitioned from the Implementation Engineering Team to the Customer Success & Managed Support Practice under the SLA terms.'}
              onChange={(e) => onUpdateField('supportTransitionText', e.target.value)}
            />
          </label>
          <label>
            <span>Support Email</span>
            <input
              value={proposal.supportEmail || 'support@ibunify.com | Contact@iglobuscc.com'}
              onChange={(e) => onUpdateField('supportEmail', e.target.value)}
            />
          </label>
          <label>
            <span>Dedicated Success Manager</span>
            <input
              value={proposal.dedicatedSuccessManager || 'Ramyasree (ramyasree@iglobuscc.com)'}
              onChange={(e) => onUpdateField('dedicatedSuccessManager', e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          4. Mutual Final Project Sign-off
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>FOR: Client</strong>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Client Entity</span>
              <input
                value={proposal.preparedFor || '[CLIENT COMPANY NAME]'}
                onChange={(e) => onUpdateField('preparedFor', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Name & Title</span>
              <input
                value={proposal.clientSignatoryName || proposal.clientAttention || '______________________'}
                onChange={(e) => onUpdateField('clientSignatoryName', e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
              <input
                value={proposal.clientSignDate || ''}
                onChange={(e) => onUpdateField('clientSignDate', e.target.value)}
                placeholder="e.g. 2026-09-15 (leave blank for line)"
              />
            </label>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>FOR: ibunify (iGLOBUS)</strong>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Name</span>
              <input
                value={proposal.providerSignatoryName || 'Rama Krishna'}
                onChange={(e) => onUpdateField('providerSignatoryName', e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Title</span>
              <input
                value={proposal.providerSignatoryTitle || 'Enterprise Practice Leads'}
                onChange={(e) => onUpdateField('providerSignatoryTitle', e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
              <input
                value={proposal.providerSignDate || ''}
                onChange={(e) => onUpdateField('providerSignDate', e.target.value)}
                placeholder="e.g. 2026-09-15 (leave blank for line)"
              />
            </label>
          </div>
        </div>

        <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
          Corporate Office & Footer
        </h3>
        <div className="form-grid">
          <label>
            <span>Footer Registered Office</span>
            <input
              value={proposal.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
              onChange={(e) => onUpdateField('footerAddress', e.target.value)}
            />
          </label>
          <label>
            <span>Footer Websites</span>
            <input
              value={proposal.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
              onChange={(e) => onUpdateField('footerWebsites', e.target.value)}
            />
          </label>
          <label>
            <span>Running Page Footnote</span>
            <input
              value={proposal.pageFootnote || 'ibunify (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com'}
              onChange={(e) => onUpdateField('pageFootnote', e.target.value)}
            />
          </label>
        </div>
      </section>
    );
  }

  // 3-Page Custom Proposal Editor
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
    'Lead Qualification & Budget Mapping: Identifies project preferences, purchase timelines, unit configurations (2BHK/3BHK), and budget ranges.',
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

  return (
    <section className="editor panel">
      <h2>Proposal Details & Settings</h2>

      {/* Cover Page Metadata */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '16px', marginBottom: '12px' }}>
        Cover Page & Metadata (Page 1)
      </h3>
      <div className="form-grid">
        <label>
          <span>Pill Badge</span>
          <input
            value={proposal.badge || 'SPECIALIZED COMMERCIAL & TECHNICAL PROPOSAL'}
            onChange={(e) => onUpdateField('badge', e.target.value)}
          />
        </label>
        <label>
          <span>Proposal Title</span>
          <input
            value={proposal.proposalTitle || 'Unified CRM, Communication & AI Sales Automation'}
            onChange={(e) => onUpdateField('proposalTitle', e.target.value)}
          />
        </label>
        <label>
          <span>Proposal Subtitle</span>
          <input
            value={proposal.subtitle || 'Built for High-Velocity Real Estate & Sales Enterprises'}
            onChange={(e) => onUpdateField('subtitle', e.target.value)}
          />
        </label>
        <label>
          <span>Proposal Reference Number</span>
          <input
            value={proposal.proposalNumber || 'IGC-IBUNIFY-2026-088'}
            onChange={(e) => onUpdateField('proposalNumber', e.target.value)}
          />
        </label>
        <label>
          <span>Client Organization (Prepared For)</span>
          <input
            value={proposal.preparedFor || '[Client Enterprise / Jayabheri Group]'}
            onChange={(e) => onUpdateField('preparedFor', e.target.value)}
          />
        </label>
        <label>
          <span>Client Attention / Sponsor</span>
          <input
            value={proposal.clientAttention || 'Attn: Project Sponsor / Sales Leadership'}
            onChange={(e) => onUpdateField('clientAttention', e.target.value)}
          />
        </label>
        <label>
          <span>Engagement Scope</span>
          <input
            value={proposal.engagement || 'iBUNIFY Platform & Integrated Services Deployment'}
            onChange={(e) => onUpdateField('engagement', e.target.value)}
          />
        </label>
        <label>
          <span>Proposal Date</span>
          <input
            value={proposal.date || ''}
            onChange={(e) => onUpdateField('date', e.target.value)}
            placeholder="e.g. August 25, 2026"
          />
        </label>
        <label>
          <span>Service Provider Name</span>
          <input
            value={proposal.preparedBy || proposal.company || 'iBUNIFY (iGLOBUS Corporate Consulting)'}
            onChange={(e) => {
              onUpdateField('preparedBy', e.target.value);
              onUpdateField('company', e.target.value);
            }}
          />
        </label>
        <label>
          <span>Headquarters Address</span>
          <input
            value={proposal.companyAddress || 'Headquarters: Madhapur, Opp. Raheja Mindspace, Hyderabad'}
            onChange={(e) => onUpdateField('companyAddress', e.target.value)}
          />
        </label>
        <label>
          <span>Digital Portals</span>
          <input
            value={proposal.portals || 'Website: www.ibunify.com | www.iglobuscc.com'}
            onChange={(e) => onUpdateField('portals', e.target.value)}
          />
        </label>
        <label>
          <span>Product Lead Contact</span>
          <input
            value={proposal.productLead || 'Product Lead: Ramyasree (+91 63005 61742 | ramyasree@iglobuscc.com)'}
            onChange={(e) => onUpdateField('productLead', e.target.value)}
          />
        </label>
        <label>
          <span>Additional Contact</span>
          <input
            value={proposal.contacts || 'Rama Krishna: +91 78420 97496'}
            onChange={(e) => onUpdateField('contacts', e.target.value)}
          />
        </label>
        <label className="full-width-label" style={{ gridColumn: '1 / -1' }}>
          <span>Overview & Philosophy Statement</span>
          <textarea
            rows="2"
            value={proposal.description || proposal.descriptionText || ''}
            onChange={(e) => {
              onUpdateField('description', e.target.value);
              onUpdateField('descriptionText', e.target.value);
            }}
          />
        </label>
      </div>

      {/* Running Header & Footer Controls */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Running Header & Footer Bar (Pages 2–5)
      </h3>
      <div className="form-grid">
        <label>
          <span>Running Header (Left)</span>
          <input
            value={proposal.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial & Services Proposal'}
            onChange={(e) => onUpdateField('headerLeft', e.target.value)}
          />
        </label>
        <label>
          <span>Running Header (Right)</span>
          <input
            value={proposal.headerRight || 'www.ibunify.com'}
            onChange={(e) => onUpdateField('headerRight', e.target.value)}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span>Running Page Footnote (Left)</span>
          <input
            value={proposal.pageFootnote || 'Confidential - iBUNIFY (iGLOBUS Corporate Consulting)'}
            onChange={(e) => onUpdateField('pageFootnote', e.target.value)}
          />
        </label>
      </div>

      {/* Key Metrics */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Key Operational Metrics (Page 2)
      </h3>
      <div className="form-grid">
        {metrics.map((m, mIdx) => (
          <div key={mIdx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label>
              <span style={{ fontSize: '11px' }}>Metric Value</span>
              <input
                value={m.value}
                onChange={(e) => {
                  const next = [...metrics];
                  next[mIdx] = { ...next[mIdx], value: e.target.value };
                  onUpdateField('metrics', next);
                }}
              />
            </label>
            <label style={{ marginTop: '6px' }}>
              <span style={{ fontSize: '11px' }}>Metric Label</span>
              <input
                value={m.label}
                onChange={(e) => {
                  const next = [...metrics];
                  next[mIdx] = { ...next[mIdx], label: e.target.value };
                  onUpdateField('metrics', next);
                }}
              />
            </label>
          </div>
        ))}
      </div>

      {/* Services Overview Pillars */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Integrated Platform Services Pillars (Page 2)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {servicesOverview.map((item, idx) => (
          <div key={item.key || idx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label>
              <span>{item.key}. Service Pillar Title</span>
              <input
                value={item.title}
                onChange={(e) => {
                  const next = [...servicesOverview];
                  next[idx] = { ...next[idx], title: e.target.value };
                  onUpdateField('servicesOverview', next);
                }}
              />
            </label>
            <label style={{ marginTop: '6px' }}>
              <span>Pillar Description</span>
              <textarea
                rows="2"
                value={item.desc}
                onChange={(e) => {
                  const next = [...servicesOverview];
                  next[idx] = { ...next[idx], desc: e.target.value };
                  onUpdateField('servicesOverview', next);
                }}
              />
            </label>
          </div>
        ))}
      </div>

      {/* AI Calling Section */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Section 2: AI Calling Services & Costing (Page 2)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          <span>AI Calling Feature Bullets (one per line)</span>
          <textarea
            rows="4"
            value={aiCallingBullets.join('\n')}
            onChange={(e) => onUpdateField('aiCallingBullets', e.target.value.split('\n'))}
          />
        </label>
        {aiCallingItems.map((item, idx) => (
          <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
            <input
              value={item.component}
              placeholder="Component"
              onChange={(e) => {
                const next = [...aiCallingItems];
                next[idx] = { ...next[idx], component: e.target.value };
                onUpdateField('aiCallingItems', next);
              }}
            />
            <input
              value={item.scope}
              placeholder="Scope"
              onChange={(e) => {
                const next = [...aiCallingItems];
                next[idx] = { ...next[idx], scope: e.target.value };
                onUpdateField('aiCallingItems', next);
              }}
            />
            <input
              value={item.investment}
              placeholder="Investment"
              onChange={(e) => {
                const next = [...aiCallingItems];
                next[idx] = { ...next[idx], investment: e.target.value };
                onUpdateField('aiCallingItems', next);
              }}
            />
          </div>
        ))}
      </div>

      {/* Cloud Telephony Section */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Section 3: Cloud Telephony Services & Costing (Page 3)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          <span>Cloud Telephony Feature Bullets (one per line)</span>
          <textarea
            rows="4"
            value={cloudTelephonyBullets.join('\n')}
            onChange={(e) => onUpdateField('cloudTelephonyBullets', e.target.value.split('\n'))}
          />
        </label>
        {cloudTelephonyItems.map((item, idx) => (
          <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
            <input
              value={item.component}
              placeholder="Component"
              onChange={(e) => {
                const next = [...cloudTelephonyItems];
                next[idx] = { ...next[idx], component: e.target.value };
                onUpdateField('cloudTelephonyItems', next);
              }}
            />
            <input
              value={item.scope}
              placeholder="Scope"
              onChange={(e) => {
                const next = [...cloudTelephonyItems];
                next[idx] = { ...next[idx], scope: e.target.value };
                onUpdateField('cloudTelephonyItems', next);
              }}
            />
            <input
              value={item.investment}
              placeholder="Investment"
              onChange={(e) => {
                const next = [...cloudTelephonyItems];
                next[idx] = { ...next[idx], investment: e.target.value };
                onUpdateField('cloudTelephonyItems', next);
              }}
            />
          </div>
        ))}
      </div>

      {/* WhatsApp Automation Section */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Section 4: WhatsApp Automation Services & Costing (Page 3)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>
          <span>WhatsApp Feature Bullets (one per line)</span>
          <textarea
            rows="4"
            value={whatsappBullets.join('\n')}
            onChange={(e) => onUpdateField('whatsappBullets', e.target.value.split('\n'))}
          />
        </label>
        {whatsappItems.map((item, idx) => (
          <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
            <input
              value={item.component}
              placeholder="Component"
              onChange={(e) => {
                const next = [...whatsappItems];
                next[idx] = { ...next[idx], component: e.target.value };
                onUpdateField('whatsappItems', next);
              }}
            />
            <input
              value={item.scope}
              placeholder="Scope"
              onChange={(e) => {
                const next = [...whatsappItems];
                next[idx] = { ...next[idx], scope: e.target.value };
                onUpdateField('whatsappItems', next);
              }}
            />
            <input
              value={item.investment}
              placeholder="Investment"
              onChange={(e) => {
                const next = [...whatsappItems];
                next[idx] = { ...next[idx], investment: e.target.value };
                onUpdateField('whatsappItems', next);
              }}
            />
          </div>
        ))}
      </div>

      {/* Commercial Investment Schedule */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Section 5: Overall Commercial Investment Schedule (Page 3)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {commercialScheduleItems.map((item, idx) => (
          <div key={item.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
            <input
              value={item.component}
              placeholder="Component"
              onChange={(e) => {
                const next = [...commercialScheduleItems];
                next[idx] = { ...next[idx], component: e.target.value };
                onUpdateField('commercialScheduleItems', next);
              }}
            />
            <input
              value={item.scope}
              placeholder="Scope"
              onChange={(e) => {
                const next = [...commercialScheduleItems];
                next[idx] = { ...next[idx], scope: e.target.value };
                onUpdateField('commercialScheduleItems', next);
              }}
            />
            <input
              value={item.investment}
              placeholder="Investment"
              onChange={(e) => {
                const next = [...commercialScheduleItems];
                next[idx] = { ...next[idx], investment: e.target.value };
                onUpdateField('commercialScheduleItems', next);
              }}
            />
          </div>
        ))}
        <label style={{ marginTop: '8px' }}>
          <span>Base Activation Package Total (Excl. Consumption & Lic.)</span>
          <input
            value={proposal.baseActivationPackageTotal || proposal.basePackageTotal || '₹75,000 + Wallet / Lic.'}
            onChange={(e) => {
              onUpdateField('baseActivationPackageTotal', e.target.value);
              onUpdateField('basePackageTotal', e.target.value);
            }}
          />
        </label>
      </div>

      {/* Roadmap & Terms */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Roadmap & Terms (Page 3)
      </h3>
      <div className="form-grid">
        <label style={{ gridColumn: '1 / -1' }}>
          <span>Section 6: Implementation Roadmap & Support SLA (one per line)</span>
          <textarea
            rows="5"
            value={roadmapBullets.join('\n')}
            onChange={(e) => onUpdateField('roadmapBullets', e.target.value.split('\n'))}
          />
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          <span>Section 7: Terms and Conditions (one per line)</span>
          <textarea
            rows="3"
            value={termsBullets.join('\n')}
            onChange={(e) => onUpdateField('termsBullets', e.target.value.split('\n'))}
          />
        </label>
      </div>

      {/* Signatories & Acceptance */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Section 8: Proposal Acceptance & Signatures (Page 3)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>Client Signatory</strong>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Header</span>
            <input
              value={proposal.clientSignatoryHeader || `ACCEPTED FOR: [${proposal.preparedFor || 'CLIENT ENTERPRISE'}]`}
              onChange={(e) => onUpdateField('clientSignatoryHeader', e.target.value)}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Name</span>
            <input
              value={proposal.clientSignatoryName || '___________________________'}
              onChange={(e) => onUpdateField('clientSignatoryName', e.target.value)}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Title</span>
            <input
              value={proposal.clientSignatoryTitle || '____________________________'}
              onChange={(e) => onUpdateField('clientSignatoryTitle', e.target.value)}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
            <input
              value={proposal.clientSignDate || ''}
              onChange={(e) => onUpdateField('clientSignDate', e.target.value)}
              placeholder="e.g. August 25, 2026"
            />
          </label>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <strong style={{ color: '#0f2b6e', display: 'block', marginBottom: '8px' }}>Service Provider Signatory</strong>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Header</span>
            <input
              value={proposal.providerSignatoryHeader || 'ACCEPTED FOR: iBUNIFY (iGLOBUS)'}
              onChange={(e) => onUpdateField('providerSignatoryHeader', e.target.value)}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Name</span>
            <input
              value={proposal.providerSignatoryName || 'Ramyasree / Rama Krishna'}
              onChange={(e) => onUpdateField('providerSignatoryName', e.target.value)}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Title</span>
            <input
              value={proposal.providerSignatoryTitle || 'Product Lead & Enterprise Practice'}
              onChange={(e) => onUpdateField('providerSignatoryTitle', e.target.value)}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Date</span>
            <input
              value={proposal.providerSignDate || 'August 25, 2026'}
              onChange={(e) => onUpdateField('providerSignDate', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Corporate Footer Box */}
      <h3 style={{ fontSize: '15px', color: '#0f2b6e', marginTop: '24px', marginBottom: '12px' }}>
        Corporate Footer Box (Page 3)
      </h3>
      <div className="form-grid">
        <label>
          <span>Company Name</span>
          <input
            value={proposal.corporateFooterCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting'}
            onChange={(e) => onUpdateField('corporateFooterCompany', e.target.value)}
          />
        </label>
        <label>
          <span>Registered Address</span>
          <input
            value={proposal.corporateFooterAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081'}
            onChange={(e) => onUpdateField('corporateFooterAddress', e.target.value)}
          />
        </label>
        <label>
          <span>Contact Details</span>
          <input
            value={proposal.corporateFooterContact || 'Contact: Ramyasree (+91 63005 61742 | ramyasree@iglobuscc.com) | Rama Krishna: +91 78420 97496'}
            onChange={(e) => onUpdateField('corporateFooterContact', e.target.value)}
          />
        </label>
        <label>
          <span>Websites</span>
          <input
            value={proposal.corporateFooterWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com'}
            onChange={(e) => onUpdateField('corporateFooterWebsites', e.target.value)}
          />
        </label>
      </div>

      {/* Additional Custom Sections if selected */}
      {selectedSection && (
        <div className="section-editor" style={{ marginTop: '24px' }}>
          <div className="section-editor-head">
            <h2>Edit Custom Section</h2>
            <div className="small-actions">
              <button type="button" className="ghost" onClick={() => onMoveSection(selectedSection.id, 'up')}>↑</button>
              <button type="button" className="ghost" onClick={() => onMoveSection(selectedSection.id, 'down')}>↓</button>
              <button type="button" className="ghost" onClick={() => onDuplicateSection(selectedSection.id)}>Duplicate</button>
              <button type="button" className="danger" onClick={() => onDeleteSection(selectedSection.id)}>Delete</button>
            </div>
          </div>
          <label>
            <span>Section Title</span>
            <input
              value={selectedSection.title}
              onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
            />
          </label>
          <label>
            <span>Section Content</span>
            <textarea
              rows="10"
              value={selectedSection.content}
              onChange={(e) => onUpdateSection(selectedSection.id, { content: e.target.value })}
            />
          </label>
        </div>
      )}
    </section>
  );
}
