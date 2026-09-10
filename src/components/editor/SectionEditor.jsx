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
              <label>
                <span>Company Phone</span>
                <input
                  value={proposal.companyPhone || ''}
                  placeholder="e.g. 084648 48389"
                  onChange={(e) => onUpdateField('companyPhone', e.target.value)}
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

  // Regular Proposal Editor
  const commercialItems = proposal.commercialItems || [];
  const useStructuredCommercials = Boolean(proposal.useStructuredCommercials);
  const { subtotal, taxAmount, grandTotal } = calculateCommercialTotals(commercialItems, proposal.taxRate);

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: 'New Commercial Line Item',
      qty: 1,
      unitPrice: 10000
    };
    onUpdateCommercials({
      commercialItems: [...commercialItems, newItem]
    });
  };

  const handleUpdateItem = (itemId, patch) => {
    const updated = commercialItems.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    onUpdateCommercials({ commercialItems: updated });
  };

  const handleDeleteItem = (itemId) => {
    const updated = commercialItems.filter((item) => item.id !== itemId);
    onUpdateCommercials({ commercialItems: updated });
  };

  return (
    <section className="editor panel">
      <h2>Proposal details</h2>

      <div className="locked-header-footer-box">
        <div className="lock-icon-title">
          <span>ℹ️</span> <strong>Sample Document Branding</strong>
        </div>
        <p>
          Header (<strong>{proposal.company || 'iBunify'} / CRM by iGLOBUS</strong>) and Footer formatting match the official sample document standard.
        </p>
      </div>

      <div className="form-grid">
        {[
          ['company', 'Company'],
          ['proposalTitle', 'Proposal title'],
          ['proposalNumber', 'Proposal number'],
          ['preparedFor', 'Prepared for'],
          ['preparedBy', 'Prepared by'],
          ['date', 'Date'],
          ['validUntil', 'Valid until'],
          ['currency', 'Currency']
        ].map(([field, label]) => (
          <label key={field}>
            <span>{label}</span>
            <input
              type={field === 'date' || field === 'validUntil' ? 'date' : 'text'}
              value={proposal[field] || ''}
              onChange={(e) => onUpdateField(field, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="commercial-toggle-container">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useStructuredCommercials}
            onChange={(e) => onUpdateCommercials({ useStructuredCommercials: e.target.checked })}
          />
          <span>Enable Structured Commercial Line-Items Table</span>
        </label>
      </div>

      {useStructuredCommercials && (
        <div className="structured-commercials-editor">
          <div className="commercials-editor-head">
            <h3>Commercial Line Items</h3>
            <button type="button" className="secondary sm" onClick={handleAddItem}>＋ Add Item</button>
          </div>

          <table className="commercial-editor-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: '80px' }}>Qty</th>
                <th style={{ width: '130px' }}>Unit Price</th>
                <th style={{ width: '130px' }}>Total</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {commercialItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                      placeholder="Item description"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(item.id, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, { unitPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td className="item-total-cell">
                    {currencySymbol}{(item.qty * item.unitPrice).toLocaleString()}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="danger icon-sm"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove line item"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="commercial-summary-bar">
            <label className="tax-label">
              <span>Tax Rate (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={proposal.taxRate || 0}
                onChange={(e) => onUpdateCommercials({ taxRate: Number(e.target.value) })}
              />
            </label>
            <div className="totals-display">
              <div>Subtotal: <strong>{currencySymbol}{subtotal.toLocaleString()}</strong></div>
              {proposal.taxRate > 0 && (
                <div>Tax ({proposal.taxRate}%): <strong>{currencySymbol}{taxAmount.toLocaleString()}</strong></div>
              )}
              <div className="grand-total-text">Grand Total: <strong>{currencySymbol}{grandTotal.toLocaleString()}</strong></div>
            </div>
          </div>
        </div>
      )}

      {selectedSection ? (
        <div className="section-editor">
          <div className="section-editor-head">
            <h2>Edit section</h2>
            <div className="small-actions">
              <button type="button" className="ghost" onClick={() => onMoveSection(selectedSection.id, 'up')}>↑</button>
              <button type="button" className="ghost" onClick={() => onMoveSection(selectedSection.id, 'down')}>↓</button>
              <button type="button" className="ghost" onClick={() => onDuplicateSection(selectedSection.id)}>Duplicate</button>
              <button type="button" className="danger" onClick={() => onDeleteSection(selectedSection.id)}>Delete</button>
            </div>
          </div>
          <label>
            <span>Section title</span>
            <input
              value={selectedSection.title}
              onChange={(e) => onUpdateSection(selectedSection.id, { title: e.target.value })}
            />
          </label>
          <label>
            <span>Section content</span>
            <textarea
              rows="14"
              value={selectedSection.content}
              onChange={(e) => onUpdateSection(selectedSection.id, { content: e.target.value })}
            />
          </label>
        </div>
      ) : (
        <div className="empty-state">Add a section to begin editing.</div>
      )}
    </section>
  );
}
