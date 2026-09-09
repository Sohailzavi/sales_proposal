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
      return (
        <section className="invoice-paper standard-invoice-paper">
          <div className="inv-top">
            <div>
              <div className="inv-brand-mark">{proposal.companyBadge || 'NS'}</div>
              <div className="inv-company-name">{proposal.company}</div>
              <div className="inv-company-meta">
                {(proposal.companyMeta || '').split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}<br/></React.Fragment>
                ))}
              </div>
            </div>
            <div>
              <div className="inv-doc-title">{proposal.proposalTitle || 'INVOICE'}</div>
              <div className="inv-doc-meta">
                <div><b>No.</b> {proposal.proposalNumber}</div>
                <div><b>Issued</b> {proposal.date}</div>
                <div><b>Due</b> {proposal.validUntil}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="inv-status">{proposal.invoiceStatus || 'Pending'}</span>
              </div>
            </div>
          </div>

          <div className="inv-parties">
            <div>
              <div className="inv-party-label">Billed to</div>
              <div className="inv-party-name">{proposal.preparedFor}</div>
              <div className="inv-party-detail">
                {(proposal.clientAddress || '').split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}<br/></React.Fragment>
                ))}
              </div>
            </div>
            <div>
              <div className="inv-party-label">Place of supply</div>
              <div className="inv-party-detail">{proposal.placeOfSupply || 'Telangana'}</div>
              <div className="inv-party-label" style={{ marginTop: '14px' }}>Payment terms</div>
              <div className="inv-party-detail">{proposal.paymentTerms || 'Net 15 days'}</div>
            </div>
          </div>

          <table className="inv-items-table">
            <thead>
              <tr>
                <th style={{ width: '34%' }}>Description</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Discount</th>
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
                    <td>
                      {item.description}
                      {item.hsnSac && <div className="inv-desc-sub">{item.hsnSac}</div>}
                    </td>
                    <td style={{ textAlign: 'right' }}>{qty} {item.unit || ''}</td>
                    <td style={{ textAlign: 'right' }}>{currencySymbol}{rate.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {item.discountPct ? `${item.discountPct}%` : item.discountAmount ? `${currencySymbol}${item.discountAmount}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>{taxRate}%</td>
                    <td style={{ textAlign: 'right' }}>{currencySymbol}{lineTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="inv-totals-wrap">
            <div className="inv-totals">
              <div className="inv-row"><span>Subtotal</span><span>{currencySymbol}{(netSubtotal + totalDiscount).toLocaleString()}</span></div>
              <div className="inv-row"><span>Discount</span><span>−{currencySymbol}{totalDiscount.toLocaleString()}</span></div>
              <div className="inv-row inv-tax-split"><span>CGST @ {proposal.cgstPct || 9}%</span><span>{currencySymbol}{cgstAmount.toLocaleString()}</span></div>
              <div className="inv-row inv-tax-split"><span>SGST @ {proposal.sgstPct || 9}%</span><span>{currencySymbol}{sgstAmount.toLocaleString()}</span></div>
              <div className="inv-row inv-grand"><span>Total Due</span><span>{currencySymbol}{totalDue.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="inv-lower">
            <div>
              <div className="inv-block-title">Notes</div>
              <div className="inv-notes">{proposal.notes}</div>
            </div>
            <div>
              <div className="inv-block-title">Payment details</div>
              <div className="inv-bank-grid">
                <div><span className="inv-k">Bank</span>{proposal.bankName}</div>
                <div><span className="inv-k">Account No.</span>{proposal.accountNo}</div>
                <div><span className="inv-k">IFSC</span>{proposal.ifscCode}</div>
                <div><span className="inv-k">UPI</span>{proposal.upiId}</div>
              </div>
            </div>
          </div>

          <div className="inv-footer">{proposal.company} &nbsp;·&nbsp; Computer-generated invoice</div>
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
