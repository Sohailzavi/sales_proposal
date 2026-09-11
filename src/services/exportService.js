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
  const PAGE1_TOTAL_LINE_CAPACITY = 16;
  const PAGE_N_LINE_CAPACITY = 22;

  const commercialItems = proposal.commercialItems || [];
  const hasCommercials = Boolean(proposal.useStructuredCommercials) && commercialItems.length > 0;

  // Cover block (title + 6 metadata fields) = ~6 lines equivalent
  const coverLinesCost = 6;
  // Commercials table (header + items + subtotal/tax/grand total) = ~5 + items count
  const commercialsLinesCost = hasCommercials ? (5 + commercialItems.length) : 0;
  const page1UsedLines = coverLinesCost + commercialsLinesCost;

  pages.push({
    pageNumber: 1,
    hasCover: true,
    hasCommercials,
    sections: []
  });

  const sections = proposal.sections || [];
  if (sections.length === 0) {
    return pages;
  }

  let currentPageIdx = 0;
  let currentLinesOnPage = page1UsedLines;

  sections.forEach((sec) => {
    const title = sec.title || 'Untitled Section';
    const content = sec.content || '';
    const rawLines = content.split('\n');

    let totalSecLines = 2; // Title line budget
    rawLines.forEach((l) => {
      totalSecLines += Math.max(1, Math.ceil((l.length || 1) / 65));
    });

    const pageCap = pages[currentPageIdx].hasCover ? PAGE1_TOTAL_LINE_CAPACITY : PAGE_N_LINE_CAPACITY;

    // If section doesn't fit on current page, push to a new page
    if (currentLinesOnPage > 0 && (currentLinesOnPage + totalSecLines > pageCap) && (totalSecLines <= PAGE_N_LINE_CAPACITY)) {
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
      const cap = pages[currentPageIdx].hasCover ? PAGE1_TOTAL_LINE_CAPACITY : PAGE_N_LINE_CAPACITY;

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
        <div class="company-name">${escapeHtml(doc.company || 'iGlobus Corporate Consulting')}</div>
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

export function discoveryToHtml(doc, forWord = false) {
  const pipelineStages = doc.pipelineStages || [];
  const useStructuredTable = doc.useStructuredTable !== false;
  const sections = doc.sections || [];

  const stageRowsHtml = pipelineStages
    .map(
      (st) => `
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;color:#1e3a8a;font-size:13px;">${escapeHtml(st.stage)}</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#334155;font-size:13px;">${escapeHtml(st.objective)}</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#334155;font-size:13px;">${escapeHtml(st.action)}</td>
    </tr>
  `
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Discovery Document')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 16px; }
    .sec-title { font-size: 14px; font-weight: 800; color: #1e3a8a; margin: 16px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12.5px; line-height: 1.55; color: #334155; margin-bottom: 12px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 14px; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: left; letter-spacing: 0.04em; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px; font-size: 12.5px; }
    .corp-box { text-align: center; font-size: 11px; color: #475569; padding: 10px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 16px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'DISCOVERY — REQUIREMENT GATHERING & SCOPING')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Discovery — Requirement Gathering & Scoping')}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || '')}</p>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-01-2026')}</div>
          <div class="p1-meta-sub">Date: ${escapeHtml(doc.date || '[Date]')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna | Sohail | Ramyasree')}</div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Enterprise Suite')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Confidential Document Template')}</span>
        </div>
        <div class="p2-subbar">${escapeHtml(doc.badge || 'DISCOVERY — REQUIREMENT GATHERING & SCOPING')}</div>

        ${sections.map((sec, idx) => `
          <div>
            <div class="sec-title">${escapeHtml(sec.title)}</div>
            ${idx === 2 && useStructuredTable ? `
              <table class="pipe-table">
                <thead>
                  <tr>
                    <th style="width:28%;">PIPELINE STAGE</th>
                    <th style="width:32%;">PRIMARY OBJECTIVE</th>
                    <th style="width:40%;">AUTOMATED SYSTEM ACTION</th>
                  </tr>
                </thead>
                <tbody>${stageRowsHtml}</tbody>
              </table>
            ` : `
              <div class="sec-text">${escapeHtml(sec.content || '').replaceAll('\n', '<br/>')}</div>
            `}
            ${idx === 3 ? `
              <div class="sign-box">
                <div>
                  <div>${escapeHtml(doc.clientSignatory || 'Client Signatory: ______________________')}</div>
                  <div style="margin-top:6px;color:#64748b;">Date: ${escapeHtml(doc.date || '[Date]')}</div>
                </div>
                <div>
                  <div><strong>${escapeHtml(doc.leadSignatory || 'iBUNIFY Lead: Rama Krishna / Sohail')}</strong></div>
                  <div style="margin-top:6px;color:#64748b;">Date: ${escapeHtml(doc.date || '[Date]')}</div>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function ndaToHtml(doc, forWord = false) {
  const sections = doc.sections || [];
  const sec1 = sections[0] || {
    title: '1. PURPOSE OF ENGAGEMENT',
    content: `This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of ${doc.effectiveDate || doc.date || '[Effective Date]'} by and between iGLOBUS Corporate Consulting Private Limited ("iBUNIFY") and ${doc.preparedFor || '[Client Company Name]'} ("Client") to protect proprietary technical, commercial, and customer information.`
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

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Mutual Non-Disclosure Agreement')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 16px; }
    .sec-title { font-size: 14px; font-weight: 800; color: #1e3a8a; margin: 16px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12.5px; line-height: 1.55; color: #334155; margin-bottom: 12px; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px; font-size: 12.5px; }
    .corp-box { text-align: center; font-size: 11px; color: #475569; padding: 10px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 16px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'MUTUAL NON-DISCLOSURE AGREEMENT (NDA)')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Mutual Non-Disclosure Agreement')}${doc.proposalTitle && !doc.proposalTitle.includes('(NDA)') ? '<br/>(NDA)' : ''}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-02-2026')}</div>
          <div class="p1-meta-sub">Date: ${escapeHtml(doc.date || '[Date]')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna | Sohail | Ramyasree')}</div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Enterprise Suite')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Confidential Document Template')}</span>
        </div>
        <div class="p2-subbar">${escapeHtml(doc.badge || 'MUTUAL NON-DISCLOSURE AGREEMENT (NDA)')}</div>

        <div>
          <div class="sec-title">${escapeHtml(sec1.title)}</div>
          <div class="sec-text">${escapeHtml(sec1.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec2.title)}</div>
          <div class="sec-text">${escapeHtml(sec2.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec3.title)}</div>
          <div class="sec-text">${escapeHtml(sec3.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec4.title)}</div>
          <div class="sec-text">${escapeHtml(sec4.content || '').replaceAll('\n', '<br/>')}</div>
          <div class="sign-box">
            <div>
              <div style="font-weight:700;color:#1e3a8a;margin-bottom:4px;">${escapeHtml(doc.clientSignatory || `FOR: [${doc.preparedFor || 'CLIENT COMPANY NAME'}]`)}</div>
              <div>Signature: __________________________</div>
              <div>Name & Title: ${escapeHtml(doc.clientSignatoryName || '______________________')}</div>
              <div style="margin-top:4px;color:#64748b;">Date: ${escapeHtml(doc.date || '[Date]')}</div>
            </div>
            <div>
              <div style="font-weight:700;color:#1e3a8a;margin-bottom:4px;">${escapeHtml(doc.leadSignatory || 'FOR: iBUNIFY (iGLOBUS)')}</div>
              <div>Signature: __________________________</div>
              <div>Name: ${escapeHtml(doc.leadSignatoryName || 'Rama Krishna / Sohail')}</div>
              <div style="margin-top:4px;color:#64748b;">Title: ${escapeHtml(doc.leadSignatoryTitle || 'Enterprise Practice Leads')}</div>
            </div>
          </div>
        </div>

        ${remainingSections.map((sec) => `
          <div>
            <div class="sec-title">${escapeHtml(sec.title)}</div>
            <div class="sec-text">${escapeHtml(sec.content || '').replaceAll('\n', '<br/>')}</div>
          </div>
        `).join('')}

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function msaToHtml(doc, forWord = false) {
  const sections = doc.sections || [];
  const sec1 = sections[0] || {
    title: '1. FRAMEWORK AGREEMENT & TERM',
    content: `This Master Services Agreement ("MSA") is entered into as of ${doc.effectiveDate || doc.date || '[Effective Date]'} by and between iGLOBUS Corporate Consulting Private Limited ("iBUNIFY") and ${doc.preparedFor || '[Client Company Name]'} ("Client"). This MSA governs all Statements of Work (SOW) executed between the parties for a term of 12 months with automatic annual renewal.`
  };
  const sec2 = sections[1] || {
    title: '2. SCOPE OF PLATFORM SERVICES',
    content:
      'iBUNIFY agrees to provide SaaS licensing, AI Calling agents, Cloud Telephony, WhatsApp Business API integrations, and ongoing technical support as set forth in applicable SOWs.'
  };
  const sec3 = sections[2] || {
    title: '3. INTELLECTUAL PROPERTY RIGHTS',
    content:
      '• Client Ownership: Client exclusively owns all customer records, prospect leads, call recordings, and corporate data stored within the platform.\n• Service Provider Ownership: iBUNIFY exclusively owns the software platform, source code, AI voice models, API connectors, and system enhancements.'
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

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Master Services Agreement (MSA)')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 16px; }
    .sec-title { font-size: 14px; font-weight: 800; color: #1e3a8a; margin: 16px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12.5px; line-height: 1.55; color: #334155; margin-bottom: 12px; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px; font-size: 12.5px; }
    .corp-box { text-align: center; font-size: 11px; color: #475569; padding: 10px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 16px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'MASTER SERVICES AGREEMENT (MSA)')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Master Services Agreement (MSA)')}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-04-2026')}</div>
          <div class="p1-meta-sub">Date: ${escapeHtml(doc.date || '[Date]')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna | Sohail | Ramyasree')}</div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Enterprise Suite')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Confidential Document Template')}</span>
        </div>
        <div class="p2-subbar">${escapeHtml(doc.badge || 'MASTER SERVICES AGREEMENT (MSA)')}</div>

        <div>
          <div class="sec-title">${escapeHtml(sec1.title)}</div>
          <div class="sec-text">${escapeHtml(sec1.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec2.title)}</div>
          <div class="sec-text">${escapeHtml(sec2.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec3.title)}</div>
          <div class="sec-text">${escapeHtml(sec3.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec4.title)}</div>
          <div class="sec-text">${escapeHtml(sec4.content || '').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">${escapeHtml(sec5.title)}</div>
          <div class="sec-text">${escapeHtml(sec5.content || '').replaceAll('\n', '<br/>')}</div>
          <div class="sign-box">
            <div>
              <div style="font-weight:700;color:#1e3a8a;margin-bottom:4px;">${escapeHtml(doc.clientSignatory || `FOR: [${doc.preparedFor || 'CLIENT COMPANY NAME'}]`)}</div>
              <div>Signature: __________________________</div>
              <div>Name & Title: ${escapeHtml(doc.clientSignatoryName || '______________________')}</div>
            </div>
            <div>
              <div style="font-weight:700;color:#1e3a8a;margin-bottom:4px;">${escapeHtml(doc.leadSignatory || 'FOR: iBUNIFY (iGLOBUS)')}</div>
              <div>Signature: __________________________</div>
              <div>Name: ${escapeHtml(doc.leadSignatoryName || 'Rama Krishna / Sohail')}</div>
            </div>
          </div>
        </div>

        ${remainingSections.map((sec) => `
          <div>
            <div class="sec-title">${escapeHtml(sec.title)}</div>
            <div class="sec-text">${escapeHtml(sec.content || '').replaceAll('\n', '<br/>')}</div>
          </div>
        `).join('')}

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function commercialProposalToHtml(doc, forWord = false) {
  const metrics = doc.metrics || [
    { value: '< 1 Min', label: 'FIRST RESPONSE SPEED' },
    { value: '100%', label: 'LEAD ATTRIBUTION' },
    { value: '3x', label: 'FOLLOW-UP VELOCITY' },
    { value: '24/7', label: 'AI VOICE & CHAT' }
  ];

  const serviceBreakdown = doc.serviceBreakdown || [
    {
      key: 'A',
      title: 'Centralized Real Estate CRM & Pipeline Platform',
      features:
        '360-degree lead view, pipeline stage management (Inquiry → Site Visit → Negotiation → Booking), multi-project inventory mapping, automated round-robin lead assignment, Meta CAPI and Google Offline Conversions sync, real-time agent activity tracking, and executive dashboards.',
      costing: '₹2,500 / user / month (Platform License) | ₹50,000 One-Time Setup (Pipeline mapping, integrations & onboarding).'
    },
    {
      key: 'B',
      title: 'Conversational AI Agent Calling Service',
      features:
        'Natural human-like conversational voice agent, instant automated outbound dialer for new digital leads, budget and timeline qualification (2BHK/3BHK preferences), re-engagement dialer for unresponsive leads, live agent transfer, and automated conversation summaries synced directly to lead cards.',
      costing: '₹7 / connected conversational call (Voice Engine included in base setup).'
    },
    {
      key: 'C',
      title: 'Integrated Cloud Telephony & Virtual Numbers',
      features:
        'Intelligent Call-to-Lead automated CRM record generation upon answering, dedicated campaign tracking virtual numbers (Meta, Google, Portals, Hoardings), after-hours hybrid mobile forwarding, IVR routing, secure cloud call recordings, and comprehensive CDR analytics.',
      costing: '₹1,500 / virtual number / month (Call-to-Lead routing engine included in base setup).'
    },
    {
      key: 'D',
      title: 'Official WhatsApp Business Platform Automation',
      features:
        'Official Meta WhatsApp Business API integration, automated brochure and price-sheet dispatch on lead capture, site-visit reminder sequences, location pins, unified multi-agent shared team inbox, and interactive quick-reply FAQ bot.',
      costing: '₹15,000 for 6 Months (API Engine & Setup) | ₹10,000 Prepaid Message Wallet (Utility: ₹0.18/msg | Marketing: ₹0.87/msg).'
    }
  ];

  const commercialScheduleItems = doc.commercialScheduleItems || [
    {
      id: 'cs-1',
      component: 'One-Time Setup & Implementation',
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
      investment: '₹1,500 / Number / mo'
    },
    {
      id: 'cs-6',
      component: 'AI Agent Calling',
      scope: 'Per connected conversational AI qualification call',
      investment: '₹7 / call'
    }
  ];

  const sowScopeActivities = doc.sowScopeActivities || [
    'Requirement Discovery & Pipeline Architecture: Define project inventory structures, custom pipeline stages, lead scoring benchmarks, and sales role authorization tiers.',
    'Omnichannel Campaign Ingestion: Connect Meta Ads (CAPI API), Google Offline Conversion tracking, website webhooks, and portal lead connectors.',
    'Telephony & AI Calling Configuration: Provision dedicated virtual numbers, configure Call-to-Lead auto record triggers, and program conversational voice scripts.',
    'WhatsApp API Integration: Register official Business API templates, design automated brochure auto-responders, and configure multi-agent shared inboxes.',
    'UAT, Training & Rollout: Conduct sandbox functional testing, administrator runbook handover, and end-user sales executive onboarding sessions.'
  ];

  const sowDeliverables = doc.sowDeliverables || [
    'Deliverable 1: System Architecture Blueprint & Lead Flow Process Mapping Document.',
    'Deliverable 2: Fully configured iBUNIFY instance integrated with Meta CAPI, Google Ads, and WhatsApp API.',
    'Deliverable 3: Operational Cloud Telephony & AI Calling Engine with real-time CDR analytics.',
    'Deliverable 4: User Acceptance Testing (UAT) Sign-off Certificate & Admin Runbooks.'
  ];

  const sowTimelineMilestones = doc.sowTimelineMilestones || [
    { activity: 'Discovery, Role Hierarchy & Lead Ingestion Setup', activeWeek: 1 },
    { activity: 'Cloud Telephony & WhatsApp Business API Deployment', activeWeek: 2 },
    { activity: 'AI Agent Calling Configuration & Integration Testing', activeWeek: 3 },
    { activity: 'User Acceptance Testing (UAT), Training & Production Go-Live', activeWeek: 4 }
  ];

  const sowInvoicingMilestones = doc.sowInvoicingMilestones || [
    {
      deliverable: 'Milestone 1: Contract Signing / Project Kick-off & Mobilization',
      percentage: '50%',
      amount: '₹25,000'
    },
    {
      deliverable: 'Milestone 2: Deployment, Integrations (Meta/WhatsApp/Telephony) & UAT Sign-off',
      percentage: '50%',
      amount: '₹25,000'
    }
  ];

  const sowAssumptions = doc.sowAssumptions || [
    'Client will designate a Project Manager to provide timely feedback/approvals within 48 hours.',
    'Client will provide necessary API access keys (Meta Business Manager, WhatsApp Business Account, Google Ads) before configuration commences.',
    'Standard support SLA guarantees Priority 1 response within < 30 minutes. Invoices are payable NET 30.'
  ];

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Commercial & Technical Proposal')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-card { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .page-card:last-child { page-break-after: auto; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .part-banner { background: #0b1f4d; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 8px; margin-bottom: 10px; }
    .sec-title { font-size: 13px; font-weight: 800; color: #1e3a8a; margin: 10px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 11.5px; line-height: 1.45; color: #334155; }
    .callout-box { padding: 8px 12px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px; font-size: 11px; color: #1e3a8a; margin: 6px 0; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 8px 0; }
    .metric-card { text-align: center; padding: 8px 4px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .metric-val { font-size: 15px; font-weight: 800; color: #2563eb; }
    .metric-lbl { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
    
    .breakdown-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 5px; font-size: 11px; }
    .breakdown-title { font-weight: 700; color: #1e3a8a; margin-bottom: 2px; }
    .breakdown-features { color: #334155; margin-bottom: 2px; line-height: 1.35; }
    .breakdown-costing { color: #047857; font-weight: 600; font-size: 10.5px; }
    
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10px; font-weight: 700; padding: 6px 8px; text-align: left; }
    .pipe-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; vertical-align: middle; }
    
    .gantt-table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 11px; }
    .gantt-table th { background: #0f2b6e; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
    .gantt-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    .gantt-chip { display: inline-block; padding: 2px 8px; background: #2563eb; color: #fff; border-radius: 999px; font-size: 9.5px; font-weight: 700; }
    
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 80px; font-weight: 900; color: rgba(15, 23, 42, 0.03); pointer-events: none; white-space: nowrap; z-index: 0; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 8px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <!-- Page 1: Cover -->
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'STANDARD COMMERCIAL PROPOSAL & STATEMENT OF WORK')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Unified CRM, Communication & AI Sales Automation')}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'Built for High-Velocity Real Estate & Sales Enterprises')}</div>
        <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'One Platform. Every Connection. Endless Growth. Connecting Meta Ads, Google Ads, Portals, Cloud Telephony, WhatsApp Business, and Conversational AI into one cohesive operating rhythm.')}</p>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Engagement: ${escapeHtml(doc.engagement || 'iBUNIFY CRM & Automation Platform Deployment')}</div>
          <div class="p1-meta-sub">Proposal Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-PROP-2026')}</div>
          <div class="p1-meta-sub">SOW Ref: ${escapeHtml(doc.sowNumber || 'IGC-IBUNIFY-SOW-2026')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Headquarters: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Digital Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna (+91 78420 97496) | Sohail (+91 96032 70390)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramyasree (+91 63005 61742)')}</div>
        </div>
      </div>
    </div>

    <!-- Page 2: Part 1 - Product Overview, Breakdown & Schedule Start -->
    <div class="page-card">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial Proposal & SOW')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Standard Master Template')}</span>
        </div>
        <div class="part-banner">PART 1: COMMERCIAL & TECHNICAL PROPOSAL</div>

        <div class="sec-title">1. ABOUT PRODUCT & SERVICES: THE POWER OF UNIFICATION</div>
        <div class="sec-text">iBUNIFY is an enterprise-grade CRM, communication, and sales automation platform engineered by iGLOBUS Corporate Consulting. Built specifically for high-velocity sales and real estate operations, iBUNIFY unifies multi-channel lead ingestion, cloud telephony, WhatsApp Business messaging, and AI conversational calling into a single operating rhythm.</div>

        <div class="callout-box"><strong>Design Principle:</strong> Connect the core before adding complexity. Ingest every lead, route every conversation instantly, automate follow-ups, and track conversions end-to-end.</div>

        <div class="metrics-grid">
          ${metrics.map((m) => `<div class="metric-card"><div class="metric-val">${escapeHtml(m.value)}</div><div class="metric-lbl">${escapeHtml(m.label)}</div></div>`).join('')}
        </div>

        <div class="sec-title" style="margin-top:4px;">2. GRANULAR SERVICE BREAKDOWN, FEATURES & COSTING</div>
        <div>
          ${serviceBreakdown.map((item) => `
            <div class="breakdown-card">
              <div class="breakdown-title">${escapeHtml(item.key)}. ${escapeHtml(item.title)}</div>
              <div class="breakdown-features"><strong>Core Features:</strong> ${escapeHtml(item.features)}</div>
              <div class="breakdown-costing"><strong>Individual Costing:</strong> ${escapeHtml(item.costing)}</div>
            </div>
          `).join('')}
        </div>

        <div class="sec-title" style="margin-top:4px;">3. OVERALL COSTING & COMMERCIAL SCHEDULE</div>
        <table class="pipe-table">
          <thead><tr><th style="width:38%;">SERVICE COMPONENT</th><th style="width:38%;">SCOPE & DELIVERABLES</th><th style="width:24%;text-align:right;">INVESTMENT (INR / ₹)</th></tr></thead>
          <tbody>
            ${commercialScheduleItems.slice(0, 1).map((it) => `<tr><td><strong>${escapeHtml(it.component)}</strong></td><td></td><td style="text-align:right;font-weight:700;">${escapeHtml(it.investment)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="p2-foot"><span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span><span>Page 2 of 5</span></div>
    </div>

    <!-- Page 3: Commercial Schedule Table Continued -->
    <div class="page-card">
      <div class="watermark">IBUNIFY CRM</div>
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial Proposal & SOW')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Standard Master Template')}</span>
        </div>

        <div style="margin-top:16px;">
          <table class="pipe-table">
            <thead><tr><th style="width:34%;">SERVICE COMPONENT</th><th style="width:42%;">SCOPE & DELIVERABLES</th><th style="width:24%;text-align:right;">INVESTMENT (INR / ₹)</th></tr></thead>
            <tbody>
              <tr><td></td><td>${escapeHtml(commercialScheduleItems[0]?.scope || 'System config, Meta CAPI, Google Ads, telephony & team training')}</td><td style="text-align:right;font-weight:700;"></td></tr>
              ${commercialScheduleItems.slice(1).map((it) => `<tr><td><strong>${escapeHtml(it.component)}</strong></td><td>${escapeHtml(it.scope)}</td><td style="text-align:right;font-weight:600;">${escapeHtml(it.investment)}</td></tr>`).join('')}
              <tr style="background:#f0f7ff;border-top:2px solid #2563eb;">
                <td colspan="2" style="font-weight:800;color:#1e3a8a;padding:10px;">Base Activation Package Total (Excl. Consumption & Lic.)</td>
                <td style="text-align:right;font-weight:800;color:#1e3a8a;padding:10px;font-size:12.5px;">${escapeHtml(doc.basePackageTotal || '₹75,000 + Wallet / Lic.')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="p2-foot"><span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span><span>Page 3 of 5</span></div>
    </div>

    <!-- Page 4: Part 2 Statement of Work (SOW) -->
    <div class="page-card">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial Proposal & SOW')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Standard Master Template')}</span>
        </div>
        <div class="part-banner">PART 2: STATEMENT OF WORK (SOW)</div>

        <div style="padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:4px;font-size:11px;color:#334155;line-height:1.45;margin-bottom:8px;">
          ${escapeHtml(doc.sowPreamble || 'THIS STATEMENT OF WORK ("SOW") is effective as of [Effective Date], by and between iGLOBUS Corporate Consulting Private Limited ("Service Provider") and [Client Company Name] ("Client"), and defines the delivery terms and execution milestones for the iBUNIFY platform.')}
        </div>

        <div class="sec-title">1. DESCRIPTION OF ASSIGNMENT & SCOPE OF WORK</div>
        <div style="font-size:10.5px;color:#475569;margin-bottom:4px;">This engagement operates under a Fixed-Price Phase-I Delivery Model. The following scope activities will be executed:</div>
        <div style="font-size:11px;color:#334155;line-height:1.4;">
          ${sowScopeActivities.map((act) => `<div style="margin-bottom:3px;">• ${escapeHtml(act)}</div>`).join('')}
        </div>

        <div class="sec-title" style="margin-top:6px;">2. DELIVERABLES MATRIX</div>
        <div style="font-size:11px;color:#334155;line-height:1.4;">
          ${sowDeliverables.map((del) => `<div style="margin-bottom:3px;">• ${escapeHtml(del)}</div>`).join('')}
        </div>

        <div class="sec-title" style="margin-top:6px;">3. PROJECT SCHEDULE & EXECUTION TIMELINE</div>
        <table class="gantt-table">
          <thead><tr><th style="width:52%;">MILESTONE ACTIVITY</th><th style="width:12%;text-align:center;">WEEK 1</th><th style="width:12%;text-align:center;">WEEK 2</th><th style="width:12%;text-align:center;">WEEK 3</th><th style="width:12%;text-align:center;">WEEK 4</th></tr></thead>
          <tbody>
            ${sowTimelineMilestones.map((m) => `
              <tr>
                <td>${escapeHtml(m.activity)}</td>
                <td style="text-align:center;">${m.activeWeek === 1 ? '<span class="gantt-chip">Active</span>' : ''}</td>
                <td style="text-align:center;">${m.activeWeek === 2 ? '<span class="gantt-chip">Active</span>' : ''}</td>
                <td style="text-align:center;">${m.activeWeek === 3 ? '<span class="gantt-chip">Active</span>' : ''}</td>
                <td style="text-align:center;">${m.activeWeek === 4 ? '<span class="gantt-chip">Active</span>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="sec-title" style="margin-top:6px;">4. SOW MILESTONE INVOICING SCHEDULE</div>
        <table class="pipe-table">
          <thead><tr><th style="width:56%;">MILESTONE DELIVERABLE</th><th style="width:20%;text-align:center;">MILESTONE %</th><th style="width:24%;text-align:right;">AMOUNT (INR / ₹)</th></tr></thead>
          <tbody>
            ${sowInvoicingMilestones.map((inv) => `<tr><td>${escapeHtml(inv.deliverable)}</td><td style="text-align:center;font-weight:600;">${escapeHtml(inv.percentage)}</td><td style="text-align:right;font-weight:600;">${escapeHtml(inv.amount)}</td></tr>`).join('')}
            <tr style="background:#f8fafc;font-weight:700;">
              <td><strong>Total Base Fixed Implementation Fee</strong></td>
              <td style="text-align:center;font-weight:700;">100%</td>
              <td style="text-align:right;font-weight:700;color:#1e3a8a;">${escapeHtml(doc.totalImplementationFee || '₹50,000')}</td>
            </tr>
          </tbody>
        </table>

        <div class="sec-title" style="margin-top:6px;">5. ENGAGEMENT ASSUMPTIONS & SLAS</div>
        <div style="font-size:11px;color:#334155;">
          <div>• ${escapeHtml(sowAssumptions[0] || '')}</div>
        </div>
      </div>
      <div class="p2-foot"><span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span><span>Page 4 of 5</span></div>
    </div>

    <!-- Page 5: SLAs continued, Section 6 Authorization & Sign-off, Corporate Footer -->
    <div class="page-card">
      <div class="watermark">IBUNIFY CRM</div>
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial Proposal & SOW')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Standard Master Template')}</span>
        </div>

        <div style="font-size:11px;color:#334155;line-height:1.45;margin-top:14px;">
          ${sowAssumptions.slice(1).map((assump) => `<div style="margin-bottom:4px;">• ${escapeHtml(assump)}</div>`).join('')}
        </div>

        <div class="sec-title" style="margin-top:16px;">6. AUTHORIZATION & SIGN-OFF</div>
        <div class="sign-box">
          <div>
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || `FOR: [${doc.preparedFor || 'CLIENT COMPANY NAME'}]`)}</div>
            <div style="font-size:10.5px;color:#64748b;margin-bottom:8px;">${escapeHtml(doc.clientSignatorySub || 'Client Authorized Signatory')}</div>
            <div style="margin-top:16px;">Name: ${escapeHtml(doc.clientSignatoryName || '___________________________')}</div>
            <div style="margin-top:4px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
            <div style="margin-top:4px;color:#64748b;">Date: ${escapeHtml(doc.date || '____________________________')}</div>
          </div>
          <div>
            <div style="font-weight:700;color:#1e3a8a;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || 'FOR: iBUNIFY (iGLOBUS)')}</div>
            <div style="font-size:10.5px;color:#64748b;margin-bottom:8px;">${escapeHtml(doc.providerSignatorySub || 'Service Provider Signatory')}</div>
            <div style="margin-top:16px;">Name: ${escapeHtml(doc.providerSignatoryName || 'Rama Krishna / Sohail')}</div>
            <div style="margin-top:4px;">Title: ${escapeHtml(doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
            <div style="margin-top:4px;color:#64748b;">Date: ${escapeHtml(doc.date || '[Date]')}</div>
          </div>
        </div>

        <div class="corp-box" style="margin-top:24px;">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div style="font-size:10px;color:#475569;margin:2px 0;">${escapeHtml(doc.footerContacts || 'Contacts: Rama Krishna (+91 78420 97496) | Sohail (+91 96032 70390) | Ramyasree (+91 63005 61742)')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>
      <div class="p2-foot"><span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span><span>Page 5 of 5</span></div>
    </div>
  </body></html>`;
}

export function slaToHtml(doc, forWord = false) {
  const incidentBenchmarks = doc.incidentBenchmarks || [
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

  const escalationMatrix = doc.escalationMatrix || [
    'Level 1 (Helpdesk): support@ibunify.com | Ticket Portal',
    'Level 2 (Technical Lead): Sohail (+91 96032 70390 | sohail@iglobus.com)',
    'Level 3 (Practice Lead): Rama Krishna (+91 78420 97496 | ramakrishna@iglobuscc.com)'
  ];

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Service Level Agreement (SLA)')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 16px; }
    .sec-title { font-size: 14px; font-weight: 800; color: #1e3a8a; margin: 16px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12.5px; line-height: 1.55; color: #334155; margin-bottom: 12px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 14px; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10.5px; font-weight: 700; padding: 8px 10px; text-align: left; }
    .pipe-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11.5px; color: #334155; vertical-align: middle; }
    .sign-box { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px; font-size: 12.5px; }
    .corp-box { text-align: center; font-size: 11px; color: #475569; padding: 10px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 16px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'SERVICE LEVEL AGREEMENT (SLA)')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Service Level Agreement (SLA)')}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-06-2026')}</div>
          <div class="p1-meta-sub">Date: ${escapeHtml(doc.date || '[Date]')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna | Sohail | Ramyasree')}</div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Enterprise Suite')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Confidential Document Template')}</span>
        </div>
        <div class="p2-subbar">${escapeHtml(doc.badge || 'SERVICE LEVEL AGREEMENT (SLA)')}</div>

        <div>
          <div class="sec-title">1. SERVICE UPTIME & INFRASTRUCTURE COMMITMENT</div>
          <div class="sec-text">${escapeHtml(doc.uptimeCommitment || 'iBUNIFY guarantees a minimum of 99.9% Platform Availability for core cloud telephony, CRM databases, and AI routing endpoints, excluding scheduled maintenance windows.')}</div>
        </div>

        <div>
          <div class="sec-title">2. INCIDENT PRIORITY & TURNAROUND BENCHMARKS</div>
          <table class="pipe-table">
            <thead>
              <tr>
                <th style="width:22%;">PRIORITY LEVEL</th>
                <th style="width:42%;">DEFINITION & IMPACT</th>
                <th style="width:18%;text-align:center;">RESPONSE SLA</th>
                <th style="width:18%;text-align:center;">RESOLUTION TARGET</th>
              </tr>
            </thead>
            <tbody>
              ${incidentBenchmarks.map((inc) => `
                <tr>
                  <td style="font-weight:700;color:#1e3a8a;">${escapeHtml(inc.level)}</td>
                  <td>${escapeHtml(inc.impact)}</td>
                  <td style="text-align:center;font-weight:600;color:#0f766e;">${escapeHtml(inc.responseSla)}</td>
                  <td style="text-align:center;font-weight:600;color:#1e3a8a;">${escapeHtml(inc.resolutionTarget)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div>
          <div class="sec-title">3. ESCALATION MATRIX</div>
          <div style="font-size:12px;color:#334155;line-height:1.6;">
            ${escalationMatrix.map((esc) => `<div>• ${escapeHtml(esc)}</div>`).join('')}
          </div>
        </div>

        <div class="sign-box">
          <div style="font-size:13px;color:#1e293b;">${escapeHtml(doc.clientAcknowledgment || 'Client Acknowledgment: ___________________')}</div>
          <div style="font-size:13px;font-weight:700;color:#1e3a8a;">${escapeHtml(doc.leadSignatory || 'iBUNIFY Success Lead: Ramyasree')}</div>
        </div>

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function poToHtml(doc, forWord = false) {
  const orderScheduleItems = doc.orderScheduleItems || [
    {
      id: 'po-item-1',
      description: 'One-Time Implementation & Setup Fee',
      qtyUnit: '1 Package',
      unitPrice: '₹50,000',
      totalAmount: '₹50,000'
    },
    {
      id: 'po-item-2',
      description: 'iBUNIFY CRM User Licenses (Quarterly)',
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

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Purchase Order (PO Template)')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 16px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 14px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; background: #f8fafc; padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 12px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #e2e8f0; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 11px; font-weight: 700; padding: 7px 10px; border-right: 1px solid #1e3a8a; text-align: left; }
    .pipe-table td { padding: 8px 10px; font-size: 11.5px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 12px; font-size: 12px; }
    .corp-box { text-align: center; font-size: 11px; color: #475569; padding: 10px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 14px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'PURCHASE ORDER (PO TEMPLATE)')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Purchase Order (PO Template)')}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-07-2026')}</div>
          <div class="p1-meta-sub">Date: ${escapeHtml(doc.date || '[Date]')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna | Sohail | Ramyasree')}</div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Enterprise Suite')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Confidential Document Template')}</span>
        </div>
        <div class="p2-subbar">${escapeHtml(doc.badge || 'PURCHASE ORDER (PO TEMPLATE)')}</div>

        <div>
          <div class="sec-title">1. PURCHASE ORDER SUMMARY</div>
          <div class="summary-grid">
            <div><span style="color:#64748b;">PO Number: </span><strong style="color:#0f2b6e;">${escapeHtml(doc.poNumber || 'PO-IBUNIFY-2026-001')}</strong></div>
            <div><span style="color:#64748b;">Payment Terms: </span><strong style="color:#0f2b6e;">${escapeHtml(doc.paymentTerms || 'NET 30')}</strong></div>
            <div><span style="color:#64748b;">PO Date: </span><strong style="color:#1e293b;">${escapeHtml(doc.poDate || doc.date || '[Date]')}</strong></div>
            <div><span style="color:#64748b;">Currency: </span><strong style="color:#1e293b;">${escapeHtml(doc.currency || 'INR (₹)')}</strong></div>
          </div>
        </div>

        <div>
          <div class="sec-title">2. ITEMIZED ORDER SCHEDULE</div>
          <table class="pipe-table">
            <thead>
              <tr>
                <th style="width:42%;">ITEM DESCRIPTION</th>
                <th style="width:18%;text-align:center;">QTY / UNIT</th>
                <th style="width:20%;text-align:right;">UNIT PRICE (₹)</th>
                <th style="width:20%;text-align:right;">TOTAL AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${orderScheduleItems.map((item) => `
                <tr>
                  <td style="font-weight:600;color:#1e293b;">${escapeHtml(item.description)}</td>
                  <td style="text-align:center;color:#475569;">${escapeHtml(item.qtyUnit)}</td>
                  <td style="text-align:right;color:#334155;">${escapeHtml(item.unitPrice)}</td>
                  <td style="text-align:right;font-weight:700;color:#0f2b6e;">${escapeHtml(item.totalAmount)}</td>
                </tr>
              `).join('')}
              <tr style="background:#f0f7ff;border-top:2px solid #38b6ff;">
                <td colspan="3" style="font-weight:800;color:#0f2b6e;font-size:11.5px;">Total Initial Purchase Order Value (Excl. Taxes)</td>
                <td style="text-align:right;font-weight:800;color:#0f2b6e;font-size:12px;">${escapeHtml(doc.totalInitialPoValue || '₹75,000 + Users')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="sec-title">3. AUTHORIZATION & APPROVAL</div>
          <div class="sign-box">
            <div>
              <div style="font-weight:700;color:#0f2b6e;margin-bottom:6px;">Issued By: ${escapeHtml(doc.issuedByClient || '[CLIENT COMPANY NAME]')}</div>
              <div style="color:#334155;margin-bottom:4px;">Authorized By: ${escapeHtml(doc.issuedByAuthorized || '__________________________')}</div>
              <div style="color:#334155;margin-bottom:4px;">Designation: ${escapeHtml(doc.issuedByDesignation || '____________________________')}</div>
              <div style="color:#64748b;">Date: ${escapeHtml(doc.issuedByDate || doc.date || '[Date]')}</div>
            </div>
            <div>
              <div style="font-weight:700;color:#0f2b6e;margin-bottom:6px;">Accepted By: ${escapeHtml(doc.acceptedByCompany || 'iGLOBUS Corporate Consulting Pvt. Ltd.')}</div>
              <div style="color:#334155;margin-bottom:4px;">Authorized By: ${escapeHtml(doc.acceptedByAuthorized || 'Rama Krishna / Sohail')}</div>
              <div style="color:#334155;margin-bottom:4px;">Designation: ${escapeHtml(doc.acceptedByDesignation || 'Enterprise Practice Leads')}</div>
              <div style="color:#64748b;">Date: ${escapeHtml(doc.acceptedByDate || doc.date || '[Date]')}</div>
            </div>
          </div>
        </div>

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function handoverToHtml(doc, forWord = false) {
  const checklistItems = doc.handoverChecklistItems || [
    {
      id: 'ho-1',
      component: 'CRM Pipeline & Lead Tracking',
      feature: 'Full customization of sales pipelines, custom deal stages, lead assignment rules, and stage-gate validation.',
      status: 'Completed & Verified'
    },
    {
      id: 'ho-2',
      component: 'Omnichannel Ingestion',
      feature: 'Automated ingestion from Web Forms, Meta Ads, and Email endpoints with zero packet loss.',
      status: 'Configured & Live'
    },
    {
      id: 'ho-3',
      component: 'Cloud Telephony (Tata Tele / Exotel)',
      feature: 'Click-to-call, live agent call forwarding, encrypted call recording logs, and automated disposition tagging.',
      status: 'Integrated & Tested'
    },
    {
      id: 'ho-4',
      component: 'WhatsApp Business API',
      feature: 'Official Meta BSP API onboarding, verified green-tick application readiness, broadcast templates & chatbots.',
      status: 'Configured & Live'
    },
    {
      id: 'ho-5',
      component: 'AI Voice Agent (Vapi.ai / Bland.ai)',
      feature: 'Inbound FAQ answering, after-hours AI answering bot, intelligent call transfer to live agents, and auto CRM logging.',
      status: 'Integrated & Tested'
    },
    {
      id: 'ho-6',
      component: 'Documentation & Training',
      feature: 'Administrator configuration guides, user runbooks, recording walkthroughs, and executive handoff sessions.',
      status: 'Handed Over & Signed Off'
    }
  ];

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(doc.proposalTitle || 'Project Delivery & Handover Sign-off')}</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #1e293b;
        background: #f1f5f9;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-1, .page-2 {
        box-sizing: border-box;
        width: 210mm;
        height: 297mm;
        margin: 0 auto 20px auto;
        padding: 24mm 20mm;
        background: #ffffff;
        position: relative;
        page-break-after: always;
        overflow: hidden;
      }
      .page-1 {
        background: linear-gradient(135deg, #091e42 0%, #0f2b6e 60%, #1e3a8a 100%);
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .p1-tag {
        display: inline-block;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.25);
        color: #93c5fd;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 2px;
        padding: 6px 14px;
        border-radius: 20px;
        margin-bottom: 18px;
      }
      .p1-title {
        font-size: 32px;
        font-weight: 800;
        line-height: 1.2;
        margin: 0 0 10px 0;
        color: #ffffff;
      }
      .p1-sub {
        font-size: 15px;
        color: #93c5fd;
        margin: 0 0 16px 0;
      }
      .p1-ref {
        font-size: 13px;
        color: #cbd5e1;
      }
      .p1-divider {
        height: 1px;
        background: linear-gradient(90deg, #38bdf8 0%, rgba(56,189,248,0) 100%);
        margin: 30px 0;
      }
      .p1-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .p1-card {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 10px;
        padding: 16px;
      }
      .p1-meta-head {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #38bdf8;
        margin-bottom: 8px;
      }
      .p1-meta-val {
        font-size: 16px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 6px;
      }
      .p1-meta-sub {
        font-size: 12px;
        color: #cbd5e1;
        margin-bottom: 3px;
      }
      .p2-top {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #475569;
        border-bottom: 2px solid #0f2b6e;
        padding-bottom: 8px;
        margin-bottom: 14px;
      }
      .sec-title {
        font-size: 14px;
        font-weight: 800;
        color: #0f2b6e;
        border-bottom: 1.5px solid #0f2b6e;
        padding-bottom: 4px;
        margin: 14px 0 8px 0;
      }
      .sec-text {
        font-size: 12px;
        line-height: 1.55;
        color: #334155;
      }
      .pipe-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        margin-top: 6px;
      }
      .pipe-table th {
        background: #0f2b6e;
        color: #ffffff;
        padding: 6px 8px;
        text-align: left;
        font-size: 10.5px;
      }
      .pipe-table td {
        padding: 6px 8px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: top;
      }
      .pipe-table tr:nth-child(even) {
        background: #f8fafc;
      }
      .status-pill {
        display: inline-block;
        background: #dcfce7;
        color: #15803d;
        padding: 2px 7px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 10px;
      }
      .sign-box {
        margin-top: 12px;
        padding: 10px 14px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        font-size: 11px;
      }
      .corp-box {
        margin-top: 10px;
        padding: 8px 12px;
        background: #f1f5f9;
        border-radius: 6px;
        font-size: 10.5px;
        color: #475569;
        text-align: center;
      }
      .p2-foot {
        position: absolute;
        bottom: 14mm;
        left: 20mm;
        right: 20mm;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #94a3b8;
        border-top: 1px solid #e2e8f0;
        padding-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-tag">${escapeHtml(doc.badge || 'PROJECT DELIVERY & HANDOVER SIGN-OFF')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Project Delivery & Handover Sign-off')}</h1>
        <div class="p1-sub">${escapeHtml(doc.handoverSubtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <div class="p1-ref">Ref: ${escapeHtml(doc.handoverRefNo || 'IGC-IBUNIFY-08-2026')} · Delivery: ${escapeHtml(doc.handoverDate || 'August 2026')}</div>
      </div>

      <div class="p1-divider"></div>

      <div class="p1-grid">
        <div class="p1-card">
          <div class="p1-meta-head">CLIENT ORGANIZATION</div>
          <div class="p1-meta-val">${escapeHtml(doc.handoverClientOrg || '[CLIENT ORGANIZATION]')}</div>
          <div class="p1-meta-sub">Project Lead: <strong>${escapeHtml(doc.handoverClientLead || 'Rama Krishna')}</strong></div>
          <div class="p1-meta-sub">Sign-off Role: Delivery Sponsor / PM</div>
        </div>
        <div class="p1-card">
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.handoverProvider || 'iGLOBUS Corporate Consulting Pvt. Ltd.')}</div>
          <div class="p1-meta-sub">Practice Lead: <strong>${escapeHtml(doc.handoverProviderLead || 'Sohail')}</strong></div>
          <div class="p1-meta-sub">Platform: iBUNIFY CRM Suite</div>
        </div>
      </div>

      <div style="font-size: 11px; color: #93c5fd; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px; display: flex; justify-content: space-between;">
        <span>iGLOBUS Corporate Consulting Pvt. Ltd. · www.ibunify.com</span>
        <span>Official Handover & Acceptance Document</span>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Project Delivery & Handover Sign-off')}</span>
          <span style="color:#0f2b6e;font-weight:700;">Ref: ${escapeHtml(doc.handoverRefNo || 'IGC-IBUNIFY-08-2026')}</span>
        </div>

        <div>
          <div class="sec-title">1. DELIVERY SCOPE VERIFICATION</div>
          <div class="sec-text">${escapeHtml(doc.handoverScopeText || 'This Delivery & Handover Document certifies that the implementation of the iBUNIFY CRM Platform has been completed in accordance with the Statement of Work.')}</div>
        </div>

        <div>
          <div class="sec-title">2. HANDOVER CHECKLIST & VERIFICATION MATRIX</div>
          <table class="pipe-table">
            <thead>
              <tr>
                <th style="width:28%;">COMPONENT</th>
                <th style="width:48%;">DELIVERED FEATURE</th>
                <th style="width:24%;text-align:center;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${checklistItems.map((item) => `
                <tr>
                  <td style="font-weight:700;color:#0f2b6e;">${escapeHtml(item.component)}</td>
                  <td style="color:#334155;">${escapeHtml(item.feature)}</td>
                  <td style="text-align:center;"><span class="status-pill">${escapeHtml(item.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div>
          <div class="sec-title">3. FORMAL DELIVERY ACCEPTANCE</div>
          <div class="sign-box">
            <div>
              <div style="font-weight:700;color:#0f2b6e;margin-bottom:4px;">Accepted by (Client Project Manager):</div>
              <div style="color:#1e293b;"><strong>Name:</strong> ${escapeHtml(doc.handoverAcceptClientName || 'Rama Krishna')}</div>
              <div style="color:#475569;"><strong>Designation:</strong> ${escapeHtml(doc.handoverAcceptClientTitle || 'Project Manager / Delivery Sponsor')}</div>
              <div style="color:#475569;"><strong>Organization:</strong> ${escapeHtml(doc.handoverAcceptClientOrg || '[CLIENT ORGANIZATION]')}</div>
              <div style="color:#64748b;margin-top:2px;">${escapeHtml(doc.handoverAcceptClientDate || 'Date: ________________________')}</div>
            </div>
            <div>
              <div style="font-weight:700;color:#0f2b6e;margin-bottom:4px;">Delivered by (iBUNIFY Lead):</div>
              <div style="color:#1e293b;"><strong>Name:</strong> ${escapeHtml(doc.handoverDeliveredLeadName || 'Sohail')}</div>
              <div style="color:#475569;"><strong>Designation:</strong> ${escapeHtml(doc.handoverDeliveredLeadTitle || 'Practice Lead — Enterprise Delivery')}</div>
              <div style="color:#475569;"><strong>Organization:</strong> ${escapeHtml(doc.handoverDeliveredLeadOrg || 'iGLOBUS Corporate Consulting Pvt. Ltd.')}</div>
              <div style="color:#64748b;margin-top:2px;">${escapeHtml(doc.handoverDeliveredLeadDate || 'Date: August 2026')}</div>
            </div>
          </div>
        </div>

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | Project Delivery Sign-off')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function closureToHtml(doc, forWord = false) {
  const metrics = doc.operationalMetrics || [
    { id: 'metric-1', value: '100%', label: 'REQUIREMENTS DELIVERED' },
    { id: 'metric-2', value: '100%', label: 'UAT SIGN-OFF' },
    { id: 'metric-3', value: '< 1 Min', label: 'AVG. RESPONSE TIME' },
    { id: 'metric-4', value: '24/7', label: 'SUPPORT ACTIVE' }
  ];

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Project Closure & Hypercare Transition')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 48px; background: linear-gradient(180deg, #0b1f4d 0%, #102e70 45%, #18449c 100%); color: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #93c5fd; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #93c5fd; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #e0e7ff; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #93c5fd; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .p1-meta-sub { font-size: 12.5px; color: #e0e7ff; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 44px 48px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 16px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 14px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .stat-box { background: #f8fafc; padding: 12px 16px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 12px; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 14px 10px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; margin-bottom: 12px; }
    .metric-cell { padding: 0 4px; }
    .metric-val { font-size: 22px; font-weight: 800; color: #0284c7; margin-bottom: 4px; }
    .metric-lbl { font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 12px; font-size: 12px; }
    .corp-box { text-align: center; font-size: 11px; color: #475569; padding: 10px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 14px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10.5px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <div>
        <div class="p1-logo">ibunify</div>
        <div class="p1-sublogo">CRM BY IGLOBUS</div>
      </div>
      <div>
        <div class="p1-badge">${escapeHtml(doc.badge || 'PROJECT CLOSURE & HYPERCARE TRANSITION')}</div>
        <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Project Closure & Hypercare Transition')}</h1>
        <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
        <div class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</div>
      </div>
      <div class="p1-meta-grid">
        <div>
          <div class="p1-meta-head">PREPARED FOR</div>
          <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: [Project Sponsor / Sales Leadership]')}</div>
          <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-09-2026')}</div>
          <div class="p1-meta-sub">Date: ${escapeHtml(doc.date || '[Date]')}</div>
        </div>
        <div>
          <div class="p1-meta-head">SERVICE PROVIDER</div>
          <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
          <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Contacts: Rama Krishna | Sohail | Ramyasree')}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#93c5fd;display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;">
        <span>ibunify · CRM BY IGLOBUS</span>
        <span>Official Handover & Acceptance Document</span>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div class="p2-top">
          <span>${escapeHtml(doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Enterprise Suite')}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(doc.headerRight || 'Confidential Document Template')}</span>
        </div>
        <div class="p2-subbar">${escapeHtml(doc.badge || 'PROJECT CLOSURE & HYPERCARE TRANSITION')}</div>

        <div>
          <div class="sec-title">1. FORMAL PROJECT CLOSURE STATEMENT</div>
          <div class="stat-box">
            ${escapeHtml(doc.formalClosureStatement || `This Project Closure Certificate formally confirms that the Phase-I deployment of the iBUNIFY CRM Platform for ${doc.preparedFor || '[Client Company Name]'} is complete and operational.`)}
          </div>
        </div>

        <div>
          <div class="sec-title">2. OPERATIONAL METRICS ACHIEVED</div>
          <div class="metric-grid">
            ${metrics.map((m, idx) => `
              <div class="metric-cell" style="${idx < metrics.length - 1 ? 'border-right: 1px solid #cbd5e1;' : ''}">
                <div class="metric-val">${escapeHtml(m.value)}</div>
                <div class="metric-lbl">${escapeHtml(m.label)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="sec-title">3. TRANSITION TO ONGOING SUPPORT & CUSTOMER SUCCESS</div>
          <div class="stat-box">
            <div style="margin-bottom:6px;">${escapeHtml(doc.supportTransitionText || 'The project is transitioned from the Implementation Engineering Team to the Customer Success & Managed Support Practice under the SLA terms.')}</div>
            <div style="font-size:11.5px;color:#0f2b6e;">• <strong>Support Email:</strong> ${escapeHtml(doc.supportEmail || 'support@ibunify.com | Contact@iglobuscc.com')}</div>
            <div style="font-size:11.5px;color:#0f2b6e;margin-top:2px;">• <strong>Dedicated Success Manager:</strong> ${escapeHtml(doc.dedicatedSuccessManager || 'Ramyasree (+91 63005 61742 | ramyasree@iglobuscc.com)')}</div>
          </div>
        </div>

        <div>
          <div class="sec-title">4. MUTUAL FINAL PROJECT SIGN-OFF</div>
          <div class="sign-box">
            <div>
              <div style="font-weight:700;color:#0f2b6e;margin-bottom:6px;">FOR: ${escapeHtml(doc.preparedFor || '[CLIENT COMPANY NAME]')}</div>
              <div style="color:#334155;margin-bottom:4px;">Signature: __________________________</div>
              <div style="color:#334155;margin-bottom:4px;">Name & Title: ${escapeHtml(doc.clientSignatoryName || doc.clientAttention || '______________________')}</div>
              <div style="color:#64748b;">Date: ${escapeHtml(doc.clientSignDate || doc.date || '[Date]')}</div>
            </div>
            <div>
              <div style="font-weight:700;color:#0f2b6e;margin-bottom:6px;">FOR: iBUNIFY (iGLOBUS)</div>
              <div style="color:#334155;margin-bottom:4px;">Signature: __________________________</div>
              <div style="color:#334155;margin-bottom:4px;">Name: ${escapeHtml(doc.providerSignatoryName || 'Rama Krishna / Sohail')}</div>
              <div style="color:#334155;">Title: ${escapeHtml(doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
            </div>
          </div>
        </div>

        <div class="corp-box">
          <div><strong>${escapeHtml(doc.footerCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting Pvt. Ltd.')}</strong></div>
          <div style="margin:2px 0;">${escapeHtml(doc.footerAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')}</div>
          <div>${escapeHtml(doc.footerWebsites || 'Websites: www.ibunify.com | www.iglobuscc.com')}</div>
        </div>
      </div>

      <div class="p2-foot">
        <span>${escapeHtml(doc.pageFootnote || 'iBUNIFY (iGLOBUS Corporate Consulting Pvt. Ltd.) | www.ibunify.com')}</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  </body></html>`;
}

export function proposalToHtml(proposal, forWord = false) {
  if (proposal.documentType === 'invoice') {
    return invoiceToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'discovery') {
    return discoveryToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'nda') {
    return ndaToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'msa') {
    return msaToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'commercial_proposal') {
    return commercialProposalToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'sla') {
    return slaToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'po') {
    return poToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'handover') {
    return handoverToHtml(proposal, forWord);
  }
  if (proposal.documentType === 'closure') {
    return closureToHtml(proposal, forWord);
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
      scrollX: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // 1. Capture live preview container directly from DOM for 100% pixel-perfect output
  const containerToCapture =
    document.querySelector('.closure-pages-container') ||
    document.querySelector('.handover-pages-container') ||
    document.querySelector('.po-pages-container') ||
    document.querySelector('.sla-pages-container') ||
    document.querySelector('.commercial-proposal-pages-container') ||
    document.querySelector('.msa-pages-container') ||
    document.querySelector('.nda-pages-container') ||
    document.querySelector('.discovery-pages-container') ||
    document.querySelector('.invoice-pages-container') ||
    document.querySelector('.proposal-pages-container') ||
    document.querySelector('.invoice-paper') ||
    document.querySelector('.proposal-paper');

  if (containerToCapture && pdfEngine) {
    const origMaxHeight = containerToCapture.style.maxHeight;
    const origOverflow = containerToCapture.style.overflow;
    const origGap = containerToCapture.style.gap;
    const origPaddingBottom = containerToCapture.style.paddingBottom;

    const cardHeaders = containerToCapture.querySelectorAll('.preview-page-card-header');
    const headerDisplayStates = [];
    cardHeaders.forEach((hdr) => {
      headerDisplayStates.push(hdr.style.display);
      hdr.style.display = 'none';
    });

    const pageCards = containerToCapture.querySelectorAll(
      '.sample-letterhead-paper, .standard-invoice-paper, .compact-invoice-paper, .discovery-cover-paper, .discovery-content-paper, .nda-cover-paper, .nda-content-paper, .msa-cover-paper, .msa-content-paper, .ctp-cover-paper, .ctp-content-paper, .sla-cover-paper, .sla-content-paper, .po-cover-paper, .po-content-paper, .handover-cover-paper, .handover-content-paper, .closure-cover-paper, .closure-content-paper'
    );
    const origCardHeights = [];
    pageCards.forEach((card) => {
      origCardHeights.push(card.style.height);
      card.style.height = '1120px';
    });

    try {
      containerToCapture.style.maxHeight = 'none';
      containerToCapture.style.overflow = 'visible';
      containerToCapture.style.gap = '0px';
      containerToCapture.style.paddingBottom = '0px';

      await pdfEngine().set(opt).from(containerToCapture).save();
      return;
    } catch (err) {
      console.warn('Direct preview element PDF capture failed, trying offscreen container:', err);
    } finally {
      containerToCapture.style.maxHeight = origMaxHeight;
      containerToCapture.style.overflow = origOverflow;
      containerToCapture.style.gap = origGap;
      containerToCapture.style.paddingBottom = origPaddingBottom;

      cardHeaders.forEach((hdr, idx) => {
        hdr.style.display = headerDisplayStates[idx];
      });

      pageCards.forEach((card, idx) => {
        card.style.height = origCardHeights[idx];
      });
    }
  }

  // 2. Fallback to offscreen container rendering if DOM element not present
  const isInvoice = proposal.documentType === 'invoice';
  const rawHtml = isInvoice ? invoiceToHtml(proposal) : proposalToHtml(proposal);
  const parsedDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const styleContent = parsedDoc.querySelector('style')?.textContent || '';
  const bodyContent = parsedDoc.body ? parsedDoc.body.innerHTML : rawHtml;

  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.zIndex = '-9999';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.style.color = '#101828';
  container.innerHTML = `<style>${styleContent}</style><div>${bodyContent}</div>`;
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

export async function generatePdfBlob(proposal) {
  const fileName = `${proposal.proposalNumber || proposal.proposalTitle || 'Proposal'}.pdf`;
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
      scrollX: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const containerToCapture =
    document.querySelector('.proposal-pages-container') ||
    document.querySelector('.invoice-paper') ||
    document.querySelector('.proposal-paper');

  if (containerToCapture && pdfEngine) {
    const origMaxHeight = containerToCapture.style.maxHeight;
    const origOverflow = containerToCapture.style.overflow;
    const origGap = containerToCapture.style.gap;
    const origPaddingBottom = containerToCapture.style.paddingBottom;

    const cardHeaders = containerToCapture.querySelectorAll('.preview-page-card-header');
    const headerDisplayStates = [];
    cardHeaders.forEach((hdr) => {
      headerDisplayStates.push(hdr.style.display);
      hdr.style.display = 'none';
    });

    const pageCards = containerToCapture.querySelectorAll('.sample-letterhead-paper, .standard-invoice-paper, .compact-invoice-paper');
    const origCardHeights = [];
    pageCards.forEach((card) => {
      origCardHeights.push(card.style.height);
      card.style.height = '1120px';
    });

    try {
      containerToCapture.style.maxHeight = 'none';
      containerToCapture.style.overflow = 'visible';
      containerToCapture.style.gap = '0px';
      containerToCapture.style.paddingBottom = '0px';

      const blob = await pdfEngine().set(opt).from(containerToCapture).output('blob');
      return new File([blob], fileName, { type: 'application/pdf' });
    } catch (err) {
      console.warn('Direct preview element PDF blob capture failed, trying offscreen container:', err);
    } finally {
      containerToCapture.style.maxHeight = origMaxHeight;
      containerToCapture.style.overflow = origOverflow;
      containerToCapture.style.gap = origGap;
      containerToCapture.style.paddingBottom = origPaddingBottom;

      cardHeaders.forEach((hdr, idx) => {
        hdr.style.display = headerDisplayStates[idx];
      });

      pageCards.forEach((card, idx) => {
        card.style.height = origCardHeights[idx];
      });
    }
  }

  const isInvoice = proposal.documentType === 'invoice';
  const rawHtml = isInvoice ? invoiceToHtml(proposal) : proposalToHtml(proposal);
  const parsedDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const styleContent = parsedDoc.querySelector('style')?.textContent || '';
  const bodyContent = parsedDoc.body ? parsedDoc.body.innerHTML : rawHtml;

  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.zIndex = '-9999';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.style.color = '#101828';
  container.innerHTML = `<style>${styleContent}</style><div>${bodyContent}</div>`;
  document.body.appendChild(container);

  try {
    if (pdfEngine) {
      const blob = await pdfEngine().set(opt).from(container).output('blob');
      return new File([blob], fileName, { type: 'application/pdf' });
    } else {
      return new File([new Blob([rawHtml], { type: 'text/html' })], `${fileName}.html`, { type: 'text/html' });
    }
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
