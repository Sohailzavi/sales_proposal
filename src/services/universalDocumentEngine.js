import { SAMPLE_LETTERHEAD_BASE64 } from '../data/letterheadBase64.js';

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function calculateInvoiceTotals(items = [], cgstPct = 9, sgstPct = 9) {
  let rawSubtotal = 0;
  let totalDiscount = 0;
  for (const item of items) {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate || item.unitPrice) || 0;
    rawSubtotal += qty * rate;
  }
  const netSubtotal = Math.max(0, rawSubtotal - totalDiscount);
  const cgst = Number(cgstPct) || 0;
  const sgst = Number(sgstPct) || 0;
  const cgstAmount = (netSubtotal * cgst) / 100;
  const sgstAmount = (netSubtotal * sgst) / 100;
  const totalDue = netSubtotal + cgstAmount + sgstAmount;
  return { netSubtotal, totalDiscount, cgstAmount, sgstAmount, totalDue };
}

/**
 * Universal Print-Accurate Document Layout Engine.
 *
 * Uses native CSS Paged Media standards (@page, thead table-header-group, tfoot table-footer-group).
 * In CSS Paged Media:
 *   - thead automatically repeats at the top of each page below the header.
 *   - tfoot / page margins automatically reserve space so content NEVER collides with the letterhead footer.
 *   - table rows break naturally with `break-inside: avoid`.
 *   - Totals & payment sections are protected with `page-break-inside: avoid`.
 */
export function generateUniversalDocumentHtml(proposal) {
  const isInvoice = proposal.documentType === 'invoice';
  const curr = proposal.currency === 'USD' ? 'USD' : (proposal.currency || 'INR');
  const currSymbol = curr === 'USD' ? '$' : '₹';

  const formatMoney = (val) => {
    try {
      return new Intl.NumberFormat(curr === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: curr,
        maximumFractionDigits: 2
      }).format(val || 0);
    } catch {
      return `${currSymbol}${Number(val || 0).toLocaleString()}`;
    }
  };

  const items = proposal.invoiceItems || [];
  const { netSubtotal, totalDiscount, cgstAmount, sgstAmount, totalDue } = calculateInvoiceTotals(
    items,
    proposal.cgstPct,
    proposal.sgstPct
  );

  const subtotal = items.reduce(
    (total, item) => total + (Number(item.qty) || 0) * (Number(item.rate) || 0),
    0
  );
  const cgstPct = typeof proposal.cgstPct === 'number' ? proposal.cgstPct : 9;
  const sgstPct = typeof proposal.sgstPct === 'number' ? proposal.sgstPct : 9;
  const cgst = (subtotal * cgstPct) / 100;
  const sgst = (subtotal * sgstPct) / 100;
  const total = subtotal + cgst + sgst;

  const companyAddressLines = (proposal.companyAddress || proposal.companyMeta || 'Techno Enclave Madhapur, Hyderabad, Telangana 500081').split('\n');
  const clientAddressLines = (proposal.clientAddress || '22 Harbour Line Road\nBandra East, Mumbai 400051\nIndia').split('\n');

  const rowsHtml = items.map((item, index) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const amount = qty * rate;

    return `
      <tr class="doc-item-row">
        <td class="col-sno">${index + 1}</td>
        <td class="col-desc">
          <div class="item-title">${escapeHtml(item.description || 'Deliverable')}</div>
          ${item.detail ? `<div class="item-detail">${escapeHtml(item.detail)}</div>` : ''}
        </td>
        <td class="col-qty">${qty}</td>
        <td class="col-rate">${formatMoney(rate)}</td>
        <td class="col-amount">${formatMoney(amount)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(proposal.proposalTitle || 'Document')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #101828;
      font-size: 13.5px;
      line-height: 1.5;
    }

    /* Fixed full-page letterhead background layer */
    .letterhead-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      z-index: -1;
      pointer-events: none;
    }

    .letterhead-bg img {
      width: 100%;
      height: 100%;
      object-fit: fill;
    }

    /* Master print table that handles genuine browser pagination */
    .print-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
    }

    /* Reserved Header space in the document flow */
    .print-header-space {
      height: 38mm; /* Exactly clears the top letterhead banner */
    }

    /* Reserved Footer space in the document flow - GUARANTEES NO FOOTER COLLISION */
    .print-footer-space {
      height: 44mm; /* Exactly clears the bottom letterhead artwork */
    }

    /* The content area inside the printable margins */
    .document-body {
      padding: 0 16mm;
    }

    /* Header block on Page 1 */
    .doc-meta-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e4e7ec;
      margin-bottom: 18px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .doc-title {
      font-size: 28px;
      font-weight: 700;
      color: #101828;
      margin: 0 0 12px 0;
      letter-spacing: -0.02em;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 16px;
      font-size: 12.5px;
      margin: 0;
    }

    .meta-grid dt {
      color: #667085;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.04em;
    }

    .meta-grid dd {
      margin: 0;
      color: #101828;
      font-weight: 600;
    }

    .company-block {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .company-name {
      font-size: 15px;
      font-weight: 700;
      color: #101828;
      margin: 0 0 4px 0;
    }

    .company-address {
      font-size: 12px;
      color: #667085;
      line-height: 1.45;
      margin: 0;
    }

    .company-address p { margin: 0; }

    /* Bill-to Section */
    .billto-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: #667085;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 4px 0;
    }

    .client-name {
      font-size: 14.5px;
      font-weight: 700;
      color: #101828;
      margin: 0 0 4px 0;
    }

    .client-address {
      font-size: 12.5px;
      color: #475467;
      line-height: 1.45;
      margin: 0;
    }

    .client-address p { margin: 0; }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .items-table thead {
      display: table-header-group; /* Repeats table headers on every continued page */
    }

    .items-table th {
      padding: 9px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475467;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }

    .items-table td {
      padding: 10px 12px;
      font-size: 13px;
      color: #101828;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }

    .doc-item-row {
      page-break-inside: avoid;
      break-inside: avoid; /* Prevents rows from ever tearing across page breaks */
    }

    .col-sno { width: 50px; color: #64748b; }
    .col-desc { width: auto; }
    .col-qty { width: 70px; text-align: right; }
    .col-rate { width: 110px; text-align: right; }
    .col-amount { width: 120px; text-align: right; font-weight: 600; }

    .item-title {
      font-weight: 600;
      color: #101828;
      margin-bottom: 2px;
    }

    .item-detail {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }

    /* Totals & Notes Section - Protected against being split */
    .summary-section {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 14px;
    }

    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }

    .totals-table {
      width: 290px;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 5px 0;
      font-size: 13px;
      color: #475467;
    }

    .totals-table td:last-child {
      text-align: right;
      font-weight: 600;
      color: #101828;
    }

    .totals-table .row-total {
      border-top: 2px solid #0f172a;
      padding-top: 8px;
      margin-top: 4px;
    }

    .totals-table .row-total td {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }

    .payment-notes {
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
    }

    .payment-notes-text {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <!-- Fixed letterhead graphic on every printed page -->
  <div class="letterhead-bg" aria-hidden="true">
    <img src="${SAMPLE_LETTERHEAD_BASE64}" alt="Letterhead" />
  </div>

  <table class="print-table">
    <thead>
      <tr>
        <td>
          <div class="print-header-space"></div>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="document-body">
            <!-- Header Section -->
            <div class="doc-meta-block">
              <div>
                <h1 class="doc-title">${escapeHtml(proposal.proposalTitle || 'Invoice')}</h1>
                <dl class="meta-grid">
                  <dt>Invoice no.</dt>
                  <dd>${escapeHtml(proposal.proposalNumber || 'INV-2026-0148')}</dd>
                  <dt>Issued</dt>
                  <dd>${escapeHtml(proposal.date || 'Sep 10, 2026')}</dd>
                  <dt>Due</dt>
                  <dd>${escapeHtml(proposal.validUntil || 'Oct 10, 2026')}</dd>
                  <dt>Terms</dt>
                  <dd>${escapeHtml(proposal.paymentTerms || 'Net 30')}</dd>
                </dl>
              </div>

              <div class="company-block">
                <div class="company-name">${escapeHtml(proposal.company || 'iGlobus Corporate Consulting')}</div>
                <div class="company-address">
                  ${companyAddressLines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
                  ${proposal.companyPhone ? `<p>Phone: ${escapeHtml(proposal.companyPhone)}</p>` : ''}
                </div>
              </div>
            </div>

            <!-- Bill-to Section -->
            <div class="billto-section">
              <div class="section-label">Bill to</div>
              <div class="client-name">${escapeHtml(proposal.preparedFor || 'Northwind Retail Pvt. Ltd.')}</div>
              <div class="client-address">
                ${proposal.clientAttention ? `<p>${escapeHtml(proposal.clientAttention)}</p>` : ''}
                ${clientAddressLines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
                ${proposal.clientEmail ? `<p>${escapeHtml(proposal.clientEmail)}</p>` : ''}
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align:left;">S. No.</th>
                  <th style="text-align:left;">Description</th>
                  <th style="text-align:right;">Qty</th>
                  <th style="text-align:right;">Rate</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <!-- Summary & Payment Block -->
            <div class="summary-section">
              <div class="totals-wrapper">
                <table class="totals-table">
                  <tr>
                    <td>Subtotal</td>
                    <td>${formatMoney(subtotal)}</td>
                  </tr>
                  <tr>
                    <td>CGST (${cgstPct}%)</td>
                    <td>${formatMoney(cgst)}</td>
                  </tr>
                  <tr>
                    <td>SGST (${sgstPct}%)</td>
                    <td>${formatMoney(sgst)}</td>
                  </tr>
                  <tr class="row-total">
                    <td>Total due</td>
                    <td>${formatMoney(total)}</td>
                  </tr>
                </table>
              </div>

              <div class="payment-notes">
                <div class="section-label">Payment details</div>
                <p class="payment-notes-text">
                  ${escapeHtml(proposal.notes || 'Payment by bank transfer to iGlobus Pvt. Ltd., HDFC Bank, A/C 5010 2233 4455, IFSC HDFC0000123. Please reference the invoice number with your payment.')}
                </p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>
          <div class="print-footer-space"></div>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}
