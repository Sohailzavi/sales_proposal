import html2pdf from 'html2pdf.js';

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function calculateCommercialTotals(items = [], taxRate = 0) {
  const subtotal = (items || []).reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
  const grandTotal = subtotal + taxAmount;
  return { subtotal, taxAmount, grandTotal };
}

export function calculateInvoiceTotals(items = [], cgstPct = 9, sgstPct = 9) {
  let rawSubtotal = 0;
  let totalDiscount = 0;

  (items || []).forEach((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const lineGross = qty * rate;
    rawSubtotal += lineGross;

    if (item.discountAmount) {
      totalDiscount += Number(item.discountAmount) || 0;
    } else if (item.discountPct) {
      totalDiscount += (lineGross * (Number(item.discountPct) || 0)) / 100;
    }
  });

  const netSubtotal = rawSubtotal - totalDiscount;
  const cgstAmount = (netSubtotal * (Number(cgstPct) || 0)) / 100;
  const sgstAmount = (netSubtotal * (Number(sgstPct) || 0)) / 100;
  const totalDue = netSubtotal + cgstAmount + sgstAmount;

  return { rawSubtotal, totalDiscount, netSubtotal, cgstAmount, sgstAmount, totalDue };
}

export function invoiceToHtml(doc, forWord = false) {
  const style = doc.invoiceStyle === 'standard' ? 'standard' : 'compact';
  const currencySymbol = doc.currency === 'USD' ? '$' : '₹';
  const items = doc.invoiceItems || [];
  const { netSubtotal, totalDiscount, cgstAmount, sgstAmount, totalDue } = calculateInvoiceTotals(items, doc.cgstPct, doc.sgstPct);

  if (style === 'standard') {
    const rowsHtml = items.map((item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const lineGross = qty * rate;
      let lineDisc = 0;
      if (item.discountAmount) lineDisc = Number(item.discountAmount) || 0;
      else if (item.discountPct) lineDisc = (lineGross * (Number(item.discountPct) || 0)) / 100;
      const lineNet = lineGross - lineDisc;
      const taxRate = item.taxPct || ((Number(doc.cgstPct) || 0) + (Number(doc.sgstPct) || 0));
      const lineTotal = lineNet + (lineNet * taxRate) / 100;

      return `
        <tr>
          <td>${escapeHtml(item.description)}<div style="color:#6b7280;font-size:11px;margin-top:2px;">${escapeHtml(item.hsnSac || '')}</div></td>
          <td style="text-align:right;">${qty} ${escapeHtml(item.unit || '')}</td>
          <td style="text-align:right;">${currencySymbol}${rate.toLocaleString()}</td>
          <td style="text-align:right;">${item.discountPct ? `${item.discountPct}%` : item.discountAmount ? `${currencySymbol}${item.discountAmount}` : '—'}</td>
          <td style="text-align:right;">${taxRate}%</td>
          <td style="text-align:right;">${currencySymbol}${lineTotal.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(doc.proposalTitle)}</title>
    <style>
      body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1f2937;background:#fff;}
      .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2454a8;padding-bottom:16px;margin-bottom:22px;}
      .brand-mark{width:44px;height:44px;border-radius:8px;background:#2454a8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;margin-bottom:10px;}
      .company-name{font-size:19px;font-weight:700;margin:0 0 4px;}
      .company-meta{font-size:12px;color:#6b7280;line-height:1.5;max-width:280px;}
      .doc-title{font-size:26px;font-weight:700;color:#2454a8;text-align:right;margin:0 0 6px;}
      .doc-meta{font-size:12px;color:#6b7280;text-align:right;line-height:1.6;}
      .status{display:inline-block;margin-top:8px;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;background:#fff4e0;color:#a15c00;}
      .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}
      .party-label{font-size:11px;color:#6b7280;margin-bottom:6px;}
      .party-name{font-size:14px;font-weight:700;margin-bottom:3px;}
      .party-detail{font-size:12.5px;color:#6b7280;line-height:1.6;}
      table.items{width:100%;border-collapse:collapse;margin-bottom:4px;}
      table.items th{background:#eaf1fb;color:#2454a8;font-size:11px;text-transform:uppercase;letter-spacing:0.02em;text-align:left;padding:9px 10px;border-bottom:1px solid #e5e7eb;}
      table.items td{font-size:12.5px;padding:10px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top;}
      .totals-wrap{display:flex;justify-content:flex-end;margin-top:14px;}
      .totals{width:280px;font-size:12.5px;}
      .totals .row{display:flex;justify-content:space-between;padding:6px 0;}
      .totals .row.tax-split{color:#6b7280;font-size:11.5px;padding:3px 0;}
      .totals .grand{border-top:2px solid #2454a8;margin-top:6px;padding-top:10px;font-size:16px;font-weight:700;color:#2454a8;}
      .lower{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;margin-top:30px;padding-top:18px;border-top:1px solid #e5e7eb;}
      .block-title{font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:8px;}
      .bank-grid{font-size:12px;line-height:1.9;}
      .bank-grid span.k{color:#6b7280;display:inline-block;width:96px;}
      .notes{font-size:12px;color:#6b7280;line-height:1.6;}
      .footer{text-align:center;font-size:11px;color:#6b7280;margin-top:26px;padding-top:14px;border-top:1px solid #e5e7eb;}
    </style></head><body>
    <div class="top">
      <div>
        <div class="brand-mark">${escapeHtml(doc.companyBadge || 'NS')}</div>
        <div class="company-name">${escapeHtml(doc.company)}</div>
        <div class="company-meta">${escapeHtml(doc.companyMeta || '').replaceAll('\n', '<br>')}</div>
      </div>
      <div>
        <div class="doc-title">${escapeHtml(doc.proposalTitle || 'INVOICE')}</div>
        <div class="doc-meta">
          <div><b>No.</b> ${escapeHtml(doc.proposalNumber)}</div>
          <div><b>Issued</b> ${escapeHtml(doc.date)}</div>
          <div><b>Due</b> ${escapeHtml(doc.validUntil)}</div>
        </div>
        <div style="text-align:right;"><span class="status">${escapeHtml(doc.invoiceStatus || 'Pending')}</span></div>
      </div>
    </div>
    <div class="parties">
      <div>
        <div class="party-label">Billed to</div>
        <div class="party-name">${escapeHtml(doc.preparedFor)}</div>
        <div class="party-detail">${escapeHtml(doc.clientAddress || '').replaceAll('\n', '<br>')}</div>
      </div>
      <div>
        <div class="party-label">Place of supply</div>
        <div class="party-detail">${escapeHtml(doc.placeOfSupply || 'Telangana')}</div>
        <div class="party-label" style="margin-top:14px;">Payment terms</div>
        <div class="party-detail">${escapeHtml(doc.paymentTerms || 'Net 15 days')}</div>
      </div>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th style="width:34%">Description</th>
          <th style="text-align:right;">Qty</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Discount</th>
          <th style="text-align:right;">Tax</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="totals-wrap">
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${currencySymbol}${(netSubtotal + totalDiscount).toLocaleString()}</span></div>
        <div class="row"><span>Discount</span><span>−${currencySymbol}${totalDiscount.toLocaleString()}</span></div>
        <div class="row tax-split"><span>CGST @ ${doc.cgstPct || 9}%</span><span>${currencySymbol}${cgstAmount.toLocaleString()}</span></div>
        <div class="row tax-split"><span>SGST @ ${doc.sgstPct || 9}%</span><span>${currencySymbol}${sgstAmount.toLocaleString()}</span></div>
        <div class="row grand"><span>Total Due</span><span>${currencySymbol}${totalDue.toLocaleString()}</span></div>
      </div>
    </div>
    <div class="lower">
      <div>
        <div class="block-title">Notes</div>
        <div class="notes">${escapeHtml(doc.notes)}</div>
      </div>
      <div>
        <div class="block-title">Payment details</div>
        <div class="bank-grid">
          <div><span class="k">Bank</span>${escapeHtml(doc.bankName)}</div>
          <div><span class="k">Account No.</span>${escapeHtml(doc.accountNo)}</div>
          <div><span class="k">IFSC</span>${escapeHtml(doc.ifscCode)}</div>
          <div><span class="k">UPI</span>${escapeHtml(doc.upiId)}</div>
        </div>
      </div>
    </div>
    <div class="footer">${escapeHtml(doc.company)} &nbsp;·&nbsp; Computer-generated invoice</div>
    </body></html>`;
  }

  // Compact Style
  const rowsHtml = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const lineGross = qty * rate;
    let lineDisc = 0;
    if (item.discountAmount) lineDisc = Number(item.discountAmount) || 0;
    else if (item.discountPct) lineDisc = (lineGross * (Number(item.discountPct) || 0)) / 100;
    const lineNet = lineGross - lineDisc;
    const taxRate = item.taxPct || ((Number(doc.cgstPct) || 0) + (Number(doc.sgstPct) || 0));
    const lineTotal = lineNet + (lineNet * taxRate) / 100;

    return `
      <tr>
        <td>${escapeHtml(item.description)} (${escapeHtml(item.hsnSac || '')})</td>
        <td style="text-align:right;">${qty} ${escapeHtml(item.unit || '')}</td>
        <td style="text-align:right;">${rate.toLocaleString()}</td>
        <td style="text-align:right;">${item.discountPct ? `${item.discountPct}%` : item.discountAmount ? `${item.discountAmount}` : '—'}</td>
        <td style="text-align:right;">${taxRate}%</td>
        <td style="text-align:right;">${lineTotal.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(doc.proposalTitle)}</title>
  <style>
    body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#14161a;font-size:11px;background:#fff;}
    .top{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:8px;border-bottom:2px solid #14161a;margin-bottom:10px;}
    .company-name{font-size:14px;font-weight:700;margin:0;}
    .company-meta{font-size:9.5px;color:#6b7178;line-height:1.4;margin-top:2px;}
    .doc-title{font-size:15px;font-weight:700;margin:0;}
    .doc-meta{font-size:9.5px;color:#6b7178;line-height:1.5;}
    .status-tag{display:inline-block;margin-top:3px;padding:1px 8px;border-radius:3px;font-size:9px;font-weight:700;background:#eef7f6;color:#0f766e;}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:10px;color:#6b7178;padding:8px 0;border-bottom:1px solid #d7dade;margin-bottom:10px;}
    .parties .name{color:#14161a;font-weight:700;font-size:11px;}
    .parties .lbl{font-size:8.5px;letter-spacing:.04em;text-transform:uppercase;color:#0f766e;margin-bottom:2px;}
    table.items{width:100%;border-collapse:collapse;}
    table.items th{font-size:8.5px;text-transform:uppercase;letter-spacing:.03em;text-align:left;padding:4px 5px;border-bottom:1.5px solid #14161a;color:#6b7178;}
    table.items td{font-size:10px;padding:5px 5px;border-bottom:1px solid #d7dade;}
    .totals-wrap{display:flex;justify-content:flex-end;margin-top:6px;}
    .totals{width:220px;font-size:10.5px;font-family:monospace;}
    .totals .row{display:flex;justify-content:space-between;padding:2.5px 0;}
    .totals .grand{border-top:1.5px solid #14161a;margin-top:4px;padding-top:5px;font-size:13px;font-weight:700;color:#0f766e;}
    .lower{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin-top:14px;padding-top:8px;border-top:1px solid #d7dade;font-size:9.5px;color:#6b7178;}
    .lower .lbl{font-size:8.5px;text-transform:uppercase;letter-spacing:.03em;color:#0f766e;margin-bottom:3px;}
    .bank-grid{line-height:1.6;}
    .bank-grid span.k{display:inline-block;width:60px;}
    .footer{text-align:center;font-size:8.5px;color:#6b7178;margin-top:12px;}
  </style></head><body>
  <div class="top">
    <div>
      <div class="company-name">${escapeHtml(doc.company)}</div>
      <div class="company-meta">${escapeHtml(doc.companyMeta || '')}</div>
    </div>
    <div style="text-align:right;">
      <div class="doc-title">${escapeHtml(doc.proposalTitle || 'INVOICE')}</div>
      <div class="doc-meta">No. ${escapeHtml(doc.proposalNumber)} &nbsp;|&nbsp; Issued ${escapeHtml(doc.date)} &nbsp;|&nbsp; Due ${escapeHtml(doc.validUntil)}</div>
      <span class="status-tag">${escapeHtml(doc.invoiceStatus || 'PENDING')}</span>
    </div>
  </div>
  <div class="parties">
    <div>
      <div class="lbl">Bill to</div>
      <div class="name">${escapeHtml(doc.preparedFor)}</div>
      ${escapeHtml(doc.clientAddress || '')}
    </div>
    <div>
      <div class="lbl">Terms</div>
      ${escapeHtml(doc.paymentTerms || 'Net 15 days')} &nbsp;|&nbsp; Place of supply: ${escapeHtml(doc.placeOfSupply || 'Telangana')}
    </div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:40%">Description</th>
        <th style="text-align:right;">Qty</th>
        <th style="text-align:right;">Rate</th>
        <th style="text-align:right;">Disc.</th>
        <th style="text-align:right;">Tax</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="totals-wrap">
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${(netSubtotal + totalDiscount).toLocaleString()}</span></div>
      <div class="row"><span>Discount</span><span>−${totalDiscount.toLocaleString()}</span></div>
      <div class="row"><span>CGST ${doc.cgstPct || 9}%</span><span>${cgstAmount.toLocaleString()}</span></div>
      <div class="row"><span>SGST ${doc.sgstPct || 9}%</span><span>${sgstAmount.toLocaleString()}</span></div>
      <div class="row grand"><span>Total Due</span><span>${currencySymbol}${totalDue.toLocaleString()}</span></div>
    </div>
  </div>
  <div class="lower">
    <div>
      <div class="lbl">Notes</div>
      ${escapeHtml(doc.notes)}
    </div>
    <div>
      <div class="lbl">Payment</div>
      <div class="bank-grid">
        <div><span class="k">Bank</span>${escapeHtml(doc.bankName)}</div>
        <div><span class="k">A/C</span>${escapeHtml(doc.accountNo)}</div>
        <div><span class="k">IFSC</span>${escapeHtml(doc.ifscCode)}</div>
        <div><span class="k">UPI</span>${escapeHtml(doc.upiId)}</div>
      </div>
    </div>
  </div>
  <div class="footer">Computer-generated invoice · ${escapeHtml(doc.company)}</div>
  </body></html>`;
}

export function proposalToHtml(proposal, forWord = false) {
  if (proposal.documentType === 'invoice') {
    return invoiceToHtml(proposal, forWord);
  }

  const currencySymbol = proposal.currency === 'INR' ? '₹' : proposal.currency === 'USD' ? '$' : `${proposal.currency} `;
  
  let commercialSectionHtml = '';
  if (proposal.useStructuredCommercials && Array.isArray(proposal.commercialItems) && proposal.commercialItems.length > 0) {
    const { subtotal, taxAmount, grandTotal } = calculateCommercialTotals(proposal.commercialItems, proposal.taxRate);
    
    const rowsHtml = proposal.commercialItems.map((item, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;"><strong>${escapeHtml(item.name)}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">${currencySymbol}${Number(item.unitPrice).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;"><strong>${currencySymbol}${(item.qty * item.unitPrice).toLocaleString()}</strong></td>
      </tr>
    `).join('');

    commercialSectionHtml = `
      <section style="margin-top: 30px;">
        <h2>Commercial Details & Financial Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 14px;">
          <thead>
            <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569;">
              <th style="padding: 10px;">#</th>
              <th style="padding: 10px;">Item / Service Description</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Unit Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="padding: 10px; text-align: right; border-top: 2px solid #cbd5e1; font-size: 13px;"><strong>Subtotal</strong></td>
              <td style="padding: 10px; text-align: right; border-top: 2px solid #cbd5e1; font-size: 13px;"><strong>${currencySymbol}${subtotal.toLocaleString()}</strong></td>
            </tr>
            ${proposal.taxRate ? `
            <tr>
              <td colspan="4" style="padding: 8px 10px; text-align: right; font-size: 13px; color: #64748b;">Tax (${proposal.taxRate}%)</td>
              <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #64748b;">${currencySymbol}${taxAmount.toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr style="background: #f1f5f9;">
              <td colspan="4" style="padding: 12px 10px; text-align: right; font-size: 15px; color: #1e1b4b;"><strong>Grand Total</strong></td>
              <td style="padding: 12px 10px; text-align: right; font-size: 15px; color: #4338ca;"><strong>${currencySymbol}${grandTotal.toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>
      </section>
    `;
  }

  const sectionHtml = (proposal.sections || [])
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <div class="section-content">${escapeHtml(section.content || '').replaceAll('\n', '<br/>')}</div>
        </section>`
    )
    .join('');

  const styles = `
    body{font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.6;margin:0;padding:40px;background:#fff}
    .cover{border-bottom:4px solid #5b4bdb;padding-bottom:28px;margin-bottom:28px}
    .brand{font-size:18px;font-weight:700;color:#5b4bdb;letter-spacing:.08em;text-transform:uppercase}
    h1{font-size:34px;line-height:1.2;margin:12px 0}
    h2{font-size:20px;color:#2d2a6e;border-bottom:1px solid #ddd;padding-bottom:8px;margin-top:30px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px 30px;margin-top:20px;font-size:14px}
    .meta strong{display:inline-block;min-width:120px}
    section{page-break-inside:avoid;margin-bottom:24px}
    .section-content{white-space:normal}
    .footer{margin-top:50px;padding-top:14px;border-top:1px solid #ddd;font-size:12px;color:#687086}
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
    proposal.proposalTitle
  )}</title><style>${styles}</style></head><body>
  <div class="cover">
    <div class="brand">${escapeHtml(proposal.company)}</div>
    <h1>${escapeHtml(proposal.proposalTitle)}</h1>
    <div class="meta">
      <div><strong>Proposal No.</strong> ${escapeHtml(proposal.proposalNumber)}</div>
      <div><strong>Date</strong> ${escapeHtml(proposal.date)}</div>
      <div><strong>Prepared for</strong> ${escapeHtml(proposal.preparedFor)}</div>
      <div><strong>Prepared by</strong> ${escapeHtml(proposal.preparedBy)}</div>
      <div><strong>Valid until</strong> ${escapeHtml(proposal.validUntil || '30 days from issue')}</div>
      <div><strong>Currency</strong> ${escapeHtml(proposal.currency)}</div>
    </div>
  </div>
  ${commercialSectionHtml}
  ${sectionHtml}
  <div class="footer">Confidential sales proposal prepared by ${escapeHtml(proposal.company)}.</div>
  ${forWord ? '<p style="font-size:10px;color:#999">Generated from the iBunify Sales Proposal Editor.</p>' : ''}
  </body></html>`;
}

export function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadOfficialPdf() {
  try {
    const response = await fetch('/iBunify-Overall-Proposal.pdf');
    if (!response.ok) throw new Error('File fetch failed');
    const blob = await response.blob();
    downloadBlob(blob, 'iBunify-Overall-Proposal.pdf', 'application/pdf');
  } catch (err) {
    console.error('Failed to download official PDF:', err);
  }
}

export async function exportPdf(proposal) {
  const fileName = `${proposal.proposalNumber || proposal.proposalTitle || 'document'}.pdf`;

  const originalOpen = window.open;
  window.open = function () {
    return null;
  };

  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.zIndex = '-99999';
  container.style.width = '210mm';
  container.style.background = '#ffffff';
  container.style.pointerEvents = 'none';
  container.innerHTML = proposalToHtml(proposal);
  document.body.appendChild(container);

  const opt = {
    margin: [8, 8, 8, 8],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const pdfEngine = typeof html2pdf === 'function' ? html2pdf : html2pdf.default || window.html2pdf;
    const worker = pdfEngine().set(opt).from(container);
    const pdfBlob = await worker.output('blob');
    downloadBlob(pdfBlob, fileName, 'application/pdf');
  } catch (err) {
    console.error('Direct PDF export error, downloading HTML document in first tab:', err);
    const html = proposalToHtml(proposal);
    downloadBlob(html, `${proposal.proposalNumber || 'document'}.html`, 'text/html;charset=utf-8');
  } finally {
    window.open = originalOpen;
    container.remove();
  }
}

export function exportWord(proposal) {
  const html = proposalToHtml(proposal, true);
  downloadBlob(html, `${proposal.proposalNumber || 'sales-proposal'}.doc`, 'application/msword');
}

export function exportHtml(proposal) {
  downloadBlob(
    proposalToHtml(proposal),
    `${proposal.proposalNumber || 'sales-proposal'}.html`,
    'text/html;charset=utf-8'
  );
}

export function exportJson(proposal) {
  downloadBlob(
    JSON.stringify(proposal, null, 2),
    `${proposal.proposalNumber || 'sales-proposal'}.json`,
    'application/json'
  );
}

export function validateImportedJson(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid JSON file structure.' };
    }
    if (!data.proposalTitle && !data.sections && !data.invoiceItems) {
      return { valid: false, error: 'File is not a valid iBunify proposal/invoice JSON.' };
    }
    const sanitizedProposal = {
      ...data,
      id: data.id || `imported-${Date.now()}`,
      company: data.company || 'iBunify',
      proposalTitle: data.proposalTitle || 'Imported Document',
      proposalNumber: data.proposalNumber || 'IMP-DOC',
      preparedFor: data.preparedFor || '',
      preparedBy: data.preparedBy || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      currency: data.currency || 'INR',
      sections: Array.isArray(data.sections) ? data.sections : [],
      invoiceItems: Array.isArray(data.invoiceItems) ? data.invoiceItems : []
    };
    return { valid: true, proposal: sanitizedProposal };
  } catch (e) {
    return { valid: false, error: `JSON Parse Error: ${e.message}` };
  }
}
