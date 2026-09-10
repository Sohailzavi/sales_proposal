import html2pdf from 'html2pdf.js';
import { SAMPLE_LETTERHEAD_BASE64 } from '../data/letterheadBase64.js';

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

export function paginateProposal(proposal) {
  const pages = [];
  const PAGE1_MAX_LINES = proposal.useStructuredCommercials ? 10 : 16;
  const PAGE_N_MAX_LINES = 24;

  pages.push({
    pageNumber: 1,
    hasCover: true,
    hasCommercials: Boolean(proposal.useStructuredCommercials) && (proposal.commercialItems || []).length > 0,
    sections: []
  });

  const sections = proposal.sections || [];
  if (sections.length === 0) {
    return pages;
  }

  let currentPageIdx = 0;
  let currentLinesOnPage = 0;

  sections.forEach((sec) => {
    const title = sec.title || 'Untitled Section';
    const content = sec.content || '';
    const rawLines = content.split('\n');

    let totalSecLines = 2; // Title line budget
    rawLines.forEach((l) => {
      totalSecLines += Math.max(1, Math.ceil((l.length || 1) / 65));
    });

    const pageCap = pages[currentPageIdx].hasCover ? PAGE1_MAX_LINES : PAGE_N_MAX_LINES;

    // If section can fit completely on a new page, push to new page instead of splitting
    if (currentLinesOnPage > 0 && (currentLinesOnPage + totalSecLines > pageCap) && (totalSecLines <= PAGE_N_MAX_LINES)) {
      pages.push({
        pageNumber: pages.length + 1,
        hasCover: false,
        sections: []
      });
      currentPageIdx = pages.length - 1;
      currentLinesOnPage = 0;
    }

    let currentChunkTitle = title;
    let currentChunkLines = [];
    let currentChunkLineCount = 2;

    rawLines.forEach((line) => {
      const lineCost = Math.max(1, Math.ceil((line.length || 1) / 65));
      const cap = pages[currentPageIdx].hasCover ? PAGE1_MAX_LINES : PAGE_N_MAX_LINES;

      if (currentLinesOnPage + currentChunkLineCount + lineCost > cap) {
        if (currentChunkLines.length > 0) {
          pages[currentPageIdx].sections.push({
            id: `${sec.id}-part-${currentPageIdx}-${pages[currentPageIdx].sections.length}`,
            title: currentChunkTitle,
            content: currentChunkLines.join('\n')
          });
        }

        pages.push({
          pageNumber: pages.length + 1,
          hasCover: false,
          sections: []
        });
        currentPageIdx = pages.length - 1;
        currentLinesOnPage = 0;

        currentChunkTitle = `${title} (Continued)`;
        currentChunkLines = [line];
        currentChunkLineCount = 2 + lineCost;
      } else {
        currentChunkLines.push(line);
        currentChunkLineCount += lineCost;
      }
    });

    if (currentChunkLines.length > 0) {
      pages[currentPageIdx].sections.push({
        id: `${sec.id}-part-end-${pages[currentPageIdx].sections.length}`,
        title: currentChunkTitle,
        content: currentChunkLines.join('\n')
      });
      currentLinesOnPage += currentChunkLineCount;
    }
  });

  return pages;
}

export function invoiceToHtml(doc, forWord = false) {
  const style = doc.invoiceStyle === 'standard' ? 'standard' : 'compact';
  const currencySymbol = doc.currency === 'USD' ? '$' : '₹';
  const items = doc.invoiceItems || [];
  const { netSubtotal, totalDiscount, cgstAmount, sgstAmount, totalDue } = calculateInvoiceTotals(items, doc.cgstPct, doc.sgstPct);

  if (style === 'standard') {
    const subtotal = items.reduce(
      (total, item) => total + (Number(item.qty) || 0) * (Number(item.rate) || 0),
      0
    );
    const curr = doc.currency || 'INR';
    const currSymbol = curr === 'USD' ? '$' : '₹';
    const cgstPct = typeof doc.cgstPct === 'number' ? doc.cgstPct : 9;
    const sgstPct = typeof doc.sgstPct === 'number' ? doc.sgstPct : 9;
    const cgst = (subtotal * cgstPct) / 100;
    const sgst = (subtotal * sgstPct) / 100;
    const total = subtotal + cgst + sgst;

    const companyAddressLines = (doc.companyAddress || doc.companyMeta || 'Techno Enclave Madhapur, Hyderabad, Telangana 500081').split('\n');
    const clientAddressLines = (doc.clientAddress || '22 Harbour Line Road\nBandra East, Mumbai 400051\nIndia').split('\n');

    const formatMoney = (val) => {
      try {
        return new Intl.NumberFormat(curr === 'INR' ? 'en-IN' : 'en-US', {
          style: 'currency',
          currency: curr,
          maximumFractionDigits: 2
        }).format(val);
      } catch {
        return `${currSymbol}${Number(val).toLocaleString()}`;
      }
    };

    const rowsHtml = items.map((item, index) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const amount = qty * rate;

      return `
        <tr>
          <td style="color:#667085;font-size:13px;">${index + 1}</td>
          <td>
            <div style="font-weight:600;color:#101828;margin-bottom:3px;font-size:13.5px;">${escapeHtml(item.description)}</div>
            ${item.detail ? `<div style="font-size:12.5px;color:#667085;">${escapeHtml(item.detail)}</div>` : ''}
          </td>
          <td style="text-align:right;">${qty}</td>
          <td style="text-align:right;">${formatMoney(rate)}</td>
          <td style="text-align:right;font-weight:600;">${formatMoney(amount)}</td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(doc.proposalTitle || 'Invoice')}</title>
    <style>
      body{margin:0;padding:40px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#101828;background:#fff;}
      .top{display:flex;justify-content:space-between;align-items:flex-start;gap:32px;padding-bottom:26px;border-bottom:1px solid #e4e7ec;}
      .title{font-size:32px;font-weight:700;color:#101828;margin:0 0 16px;letter-spacing:-0.02em;}
      .meta-grid{display:grid;grid-template-columns:auto 1fr;gap:6px 18px;font-size:13px;margin:0;}
      .meta-grid dt{color:#667085;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.04em;margin:0;}
      .meta-grid dd{color:#101828;font-weight:600;margin:0;}
      .company-block{display:flex;flex-direction:column;align-items:flex-end;text-align:right;}
      .logo{height:48px;width:auto;max-width:220px;object-fit:contain;margin-bottom:8px;}
      .company-name{font-size:15px;font-weight:700;color:#101828;margin:0 0 4px;}
      .address{font-style:normal;font-size:12.5px;color:#667085;line-height:1.5;margin:0;}
      .address p{margin:0;}
      .bill-to{margin-top:24px;margin-bottom:24px;}
      .section-label{font-size:11px;font-weight:700;color:#667085;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px;}
      .client-name{font-size:16px;font-weight:700;color:#101828;margin:0 0 4px;}
      .client-address{font-style:normal;font-size:13px;color:#667085;line-height:1.55;margin:0;}
      .client-address p{margin:0;}
      table.items{width:100%;border-collapse:collapse;margin-top:24px;text-align:left;}
      table.items th{padding:10px 12px;font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#667085;border-bottom:1px solid #e4e7ec;}
      table.items td{padding:13px 12px;font-size:13.5px;color:#101828;vertical-align:top;border-bottom:1px solid #f2f4f7;}
      .totals-wrap{display:flex;justify-content:flex-end;margin-top:22px;}
      .totals{width:300px;margin:0;display:flex;flex-direction:column;gap:8px;}
      .totals-row{display:flex;justify-content:space-between;font-size:13.5px;color:#667085;}
      .totals-row dt{margin:0;}
      .totals-row dd{margin:0;font-weight:600;color:#101828;}
      .total-due{border-top:2px solid #101828;padding-top:10px;margin-top:4px;font-size:16px;font-weight:700;color:#101828;}
      .total-due dt{color:#101828;font-weight:700;}
      .total-due dd{color:#101828;font-weight:700;font-size:16.5px;}
      .footer{margin-top:36px;padding-top:20px;border-top:1px solid #e4e7ec;}
      .notes{font-size:12.5px;color:#667085;line-height:1.6;margin:6px 0 0;}
    </style></head><body>
    <div class="top">
      <div>
        <h1 class="title">${escapeHtml(doc.proposalTitle || 'Invoice')}</h1>
        <dl class="meta-grid">
          <dt>Invoice no.</dt>
          <dd>${escapeHtml(doc.proposalNumber || 'INV-2026-0148')}</dd>
          <dt>Issued</dt>
          <dd>${escapeHtml(doc.date || 'Sep 10, 2026')}</dd>
          <dt>Due</dt>
          <dd>${escapeHtml(doc.validUntil || 'Oct 10, 2026')}</dd>
          <dt>Terms</dt>
          <dd>${escapeHtml(doc.paymentTerms || 'Net 30')}</dd>
        </dl>
      </div>
      <div class="company-block">
        ${doc.companyLogoUrl ? `<img src="${escapeHtml(doc.companyLogoUrl)}" alt="Logo" class="logo" />` : ''}
        <div class="company-name">${escapeHtml(doc.company || 'I-Globus Corporate Consulting')}</div>
        <address class="address">
          ${companyAddressLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}
          ${doc.companyPhone ? `<p>Phone: ${escapeHtml(doc.companyPhone)}</p>` : ''}
        </address>
      </div>
    </div>
    <div class="bill-to">
      <div class="section-label">Bill to</div>
      <div class="client-name">${escapeHtml(doc.preparedFor || 'Northwind Retail Pvt. Ltd.')}</div>
      <address class="client-address">
        ${doc.clientAttention ? `<p>${escapeHtml(doc.clientAttention)}</p>` : ''}
        ${clientAddressLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}
        ${doc.clientEmail ? `<p>${escapeHtml(doc.clientEmail)}</p>` : ''}
      </address>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th style="width:56px;">S. No.</th>
          <th>Description</th>
          <th style="text-align:right;">Qty</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="totals-wrap">
      <dl class="totals">
        <div class="totals-row">
          <dt>Subtotal</dt>
          <dd>${formatMoney(subtotal)}</dd>
        </div>
        <div class="totals-row">
          <dt>CGST (${cgstPct}%)</dt>
          <dd>${formatMoney(cgst)}</dd>
        </div>
        <div class="totals-row">
          <dt>SGST (${sgstPct}%)</dt>
          <dd>${formatMoney(sgst)}</dd>
        </div>
        <div class="totals-row total-due">
          <dt>Total due</dt>
          <dd>${formatMoney(total)}</dd>
        </div>
      </dl>
    </div>
    <div class="footer">
      <div class="section-label">Payment details</div>
      <div class="notes">${escapeHtml(doc.notes || '')}</div>
    </div>
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

  const pages = paginateProposal(proposal);

  const pagesHtml = pages.map((page) => {
    let content = '';

    if (page.hasCover) {
      content += `
        <div class="cover">
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
        ${page.hasCommercials ? commercialSectionHtml : ''}
      `;
    }

    (page.sections || []).forEach((sec) => {
      content += `
        <section>
          <h2>${escapeHtml(sec.title)}</h2>
          <div class="section-content">${escapeHtml(sec.content || '').replaceAll('\n', '<br/>')}</div>
        </section>
      `;
    });

    return `
      <div class="letterhead-container sample-letterhead-paper">
        <img src="${SAMPLE_LETTERHEAD_BASE64}" class="letterhead-bg-img" alt="" />
        <div class="letterhead-content-wrap">
          ${content}
        </div>
      </div>
    `;
  }).join('');

  const styles = `
    @page { size: A4 portrait; margin: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #172033;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .letterhead-container {
      box-sizing: border-box !important;
      width: 210mm !important;
      height: 297mm !important;
      page-break-after: always !important;
      position: relative !important;
      overflow: hidden !important;
      background-color: #ffffff !important;
    }
    .letterhead-container:last-child {
      page-break-after: auto !important;
    }
    .letterhead-bg-img {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: fill !important;
      z-index: 0 !important;
    }
    .letterhead-content-wrap {
      position: relative !important;
      z-index: 1 !important;
      padding: 135px 48px 145px 48px !important;
      box-sizing: border-box !important;
    }
    .cover { border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 28px; }
    h1 { font-size: 30px; line-height: 1.2; margin: 10px 0; color: #172033; }
    h2 { font-size: 20px; color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; margin-top: 20px; font-size: 13px; background: rgba(248, 250, 252, 0.85); padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta strong { display: inline-block; min-width: 120px; color: #475569; }
    section { page-break-inside: avoid; margin-bottom: 24px; }
    .section-content { white-space: normal; color: #172033; }
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
    proposal.proposalTitle
  )}</title><style>${styles}</style></head><body>
  ${pagesHtml}
  ${forWord ? '<p style="font-size:10px;color:#999;padding-left:48px">Generated from the iBunify Sales Proposal Editor.</p>' : ''}
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

  const pdfEngine = typeof html2pdf === 'function' ? html2pdf : html2pdf?.default || window.html2pdf;

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 800
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // 1. If the live preview element is in DOM, capture directly for 100% pixel-perfect output
  const renderedEl = document.querySelector('.invoice-paper') || document.querySelector('.proposal-paper') || document.querySelector('.proposal-pages-container');
  if (renderedEl && pdfEngine) {
    try {
      await pdfEngine().set(opt).from(renderedEl).save();
      return;
    } catch (err) {
      console.warn('Direct preview element PDF capture failed, trying offscreen container:', err);
    }
  }

  // 2. Offscreen container fallback
  const isInvoice = proposal.documentType === 'invoice';
  const rawHtml = isInvoice ? invoiceToHtml(proposal) : proposalToHtml(proposal);
  const parsedDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const styleContent = parsedDoc.querySelector('style')?.textContent || '';
  const bodyContent = parsedDoc.body ? parsedDoc.body.innerHTML : rawHtml;

  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '780px';
  container.style.background = '#ffffff';
  container.style.color = '#101828';
  container.innerHTML = `<style>${styleContent}</style><div style="padding:20px;background:#fff;color:#101828;">${bodyContent}</div>`;
  document.body.appendChild(container);

  try {
    if (pdfEngine) {
      await pdfEngine().set(opt).from(container).save();
    } else {
      downloadBlob(rawHtml, `${proposal.proposalNumber || 'document'}.html`, 'text/html;charset=utf-8');
    }
  } catch (err) {
    console.error('PDF export error:', err);
    downloadBlob(rawHtml, `${proposal.proposalNumber || 'document'}.html`, 'text/html;charset=utf-8');
  } finally {
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
