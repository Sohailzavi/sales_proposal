import React from 'react';
import { calculateCommercialTotals, calculateInvoiceTotals } from '../../services/exportService.js';

export function ProposalPreview({ proposal }) {
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
        <section className="invoice-paper standard-invoice-paper">
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
              <p className="std-inv-company-name">{proposal.company || 'I-Globus Corporate Consulting'}</p>
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
        </section>
      );
    }

    // Compact Invoice View
    return (
      <section className="invoice-paper compact-invoice-paper">
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
      </section>
    );
  }

  // Standard Proposal Paper Preview
  const commercialItems = proposal.commercialItems || [];
  const useStructuredCommercials = Boolean(proposal.useStructuredCommercials) && commercialItems.length > 0;
  const { subtotal, taxAmount, grandTotal } = calculateCommercialTotals(commercialItems, proposal.taxRate);

  return (
    <section className="proposal-paper">
      <div className="cover-block">
        <div className="brand-mark">{proposal.company}</div>
        <h1>{proposal.proposalTitle}</h1>
        <div className="proposal-meta">
          <div><span>Proposal No.</span><strong>{proposal.proposalNumber}</strong></div>
          <div><span>Date</span><strong>{proposal.date}</strong></div>
          <div><span>Prepared for</span><strong>{proposal.preparedFor}</strong></div>
          <div><span>Prepared by</span><strong>{proposal.preparedBy}</strong></div>
          <div><span>Valid until</span><strong>{proposal.validUntil || '30 days from issue'}</strong></div>
          <div><span>Currency</span><strong>{proposal.currency}</strong></div>
        </div>
      </div>

      {useStructuredCommercials && (
        <article className="commercial-preview-block">
          <h2>Commercial Details & Financial Summary</h2>
          <table className="commercial-paper-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item / Service Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {commercialItems.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{item.name}</strong></td>
                  <td style={{ textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right' }}>{currencySymbol}{Number(item.unitPrice).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}><strong>{currencySymbol}${(item.qty * item.unitPrice).toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right' }}><strong>Subtotal</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{currencySymbol}{subtotal.toLocaleString()}</strong></td>
              </tr>
              {proposal.taxRate > 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', color: '#64748b' }}>Tax ({proposal.taxRate}%)</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{currencySymbol}{taxAmount.toLocaleString()}</td>
                </tr>
              )}
              <tr className="grand-total-row">
                <td colSpan="4" style={{ textAlign: 'right' }}><strong>Grand Total</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{currencySymbol}{grandTotal.toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>
        </article>
      )}

      {(proposal.sections || []).map((section) => (
        <article key={section.id}>
          <h2>{section.title}</h2>
          <div className="proposal-content">{section.content}</div>
        </article>
      ))}

      <footer>Confidential sales proposal prepared by {proposal.company}.</footer>
    </section>
  );
}
