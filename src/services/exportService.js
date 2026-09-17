import html2pdf from 'html2pdf.js';
import { SAMPLE_LETTERHEAD_BASE64 } from '../data/letterheadBase64.js';

export function sanitizeProposalData(data) {
  if (typeof data === 'string') {
    return data
      .replace(/[iI][bB][uU][nN][iI][fF][yY]/g, 'iBUNIFY');
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeProposalData);
  }
  if (data && typeof data === 'object') {
    return res;
  }
  return data;
}

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
  const PAGE1_TOTAL_LINE_CAPACITY = 32;
  const PAGE_N_LINE_CAPACITY = 34;

  const commercialItems = proposal.commercialItems || [];
  const hasCommercials = Boolean(proposal.useStructuredCommercials) && commercialItems.length > 0;

  // Cover block (title + 6 metadata fields) = ~7 lines equivalent
  const coverLinesCost = 7;
  // Commercials table (header + items + subtotal/tax/grand total) = ~4 + items * 1.1
  const commercialsLinesCost = hasCommercials ? (4 + Math.ceil(commercialItems.length * 1.1)) : 0;
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
      totalSecLines += Math.max(1, Math.ceil((l.length || 1) / 80));
    });

    const pageCap = pages[currentPageIdx].hasCover ? PAGE1_TOTAL_LINE_CAPACITY : PAGE_N_LINE_CAPACITY;
    const remainingOnPage = pageCap - currentLinesOnPage;

    // If entire section fits, place it directly
    if (currentLinesOnPage + totalSecLines <= pageCap) {
      pages[currentPageIdx].sections.push({
        id: `${sec.id}-full`,
        title,
        content
      });
      currentLinesOnPage += totalSecLines;
      return;
    }

    // If there is very little room on current page (< 4 lines), start on a new page to avoid orphan headers
    if (remainingOnPage < 4 && currentLinesOnPage > 0) {
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
    let currentChunkLineCount = 2; // Title budget

    rawLines.forEach((line) => {
      const lineCost = Math.max(1, Math.ceil((line.length || 1) / 80));
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
        <div class="company-name">${escapeHtml(doc.company || 'iGLOBUS Corporate Consulting')}</div>
        <address class="address">
          ${companyAddressLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}
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
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: auto; margin-bottom: 0; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }
    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 14px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; table-layout: fixed; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10px; font-weight: 700; padding: 5px 8px; text-align: left; letter-spacing: 0.04em; }
    .pipe-table td { padding: 5px 8px; font-size: 11px; line-height: 1.35; color: #334155; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px 12px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 6px; border-top: 1px solid #cbd5e1; margin-top: 8px; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">

        <div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Discovery — Requirement Gathering & Scoping')}</h1>
          <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
          <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || '')}</p>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-01-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.date ? doc.date : '______________________')}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'ibunify (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
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
              <div style="display:flex;gap:16px;margin-top:10px;">
                <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
                  <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || doc.clientSignatory || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
                  <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
                  <div style="height:42px;"></div>
                  <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
                  <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.clientSignatoryName || '___________________________')}</div>
                  <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
                  <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
                </div>
                <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
                  <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || doc.leadSignatory || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
                  <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
                  <div style="height:42px;"></div>
                  <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
                  <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.leadSignatoryName || doc.providerSignatoryName || 'Rama Krishna')}</div>
                  <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.leadSignatoryTitle || doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
                  <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.leadSignDate ? doc.leadSignDate : (doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________')))}</div>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </body></html>`;
}

export function ndaToHtml(doc, forWord = false) {
  const sections = doc.sections || [];
  const sec1 = sections[0] || {
    title: '1. PURPOSE OF ENGAGEMENT',
    content: `This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of ${(doc.effectiveDate || doc.date) ? (doc.effectiveDate || doc.date) : '______________________'} by and between iGLOBUS Corporate Consulting Private Limited ("ibunify") and ${doc.preparedFor || '[Client Company Name]'} ("Client") to protect proprietary technical, commercial, and customer information.`
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
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }

    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 14px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px 12px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 6px; border-top: 1px solid #cbd5e1; margin-top: 8px; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">

        <div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Mutual Non-Disclosure Agreement')}${doc.proposalTitle && !doc.proposalTitle.includes('(NDA)') ? '<br/>(NDA)' : ''}</h1>
          <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
          <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-02-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.effectiveDate ? doc.effectiveDate : (doc.date ? doc.date : '______________________'))}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'ibunify (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>

        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
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
          <div style="display:flex;gap:16px;margin-top:10px;">
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || doc.clientSignatory || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.clientSignatoryName || '___________________________')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || doc.leadSignatory || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.leadSignatoryName || doc.providerSignatoryName || 'Rama Krishna')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.leadSignatoryTitle || doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.leadSignDate ? doc.leadSignDate : (doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________')))}</div>
            </div>
          </div>
        </div>

        ${remainingSections.map((sec) => `
          <div>
            <div class="sec-title">${escapeHtml(sec.title)}</div>
            <div class="sec-text">${escapeHtml(sec.content || '').replaceAll('\n', '<br/>')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </body></html>`;
}

export function msaToHtml(doc, forWord = false) {
  const sections = doc.sections || [];
  const sec1 = sections[0] || {
    title: '1. FRAMEWORK AGREEMENT & TERM',
    content: `This Master Services Agreement ("MSA") is entered into as of ${(doc.effectiveDate || doc.date) ? (doc.effectiveDate || doc.date) : '______________________'} by and between iGLOBUS Corporate Consulting Private Limited ("ibunify") and ${doc.preparedFor || '[Client Company Name]'} ("Client"). This MSA governs all Statements of Work (SOW) executed between the parties for a term of 12 months with automatic annual renewal.`
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

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Master Services Agreement (MSA)')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: auto; margin-bottom: 0; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }

    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 14px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px 12px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 6px; border-top: 1px solid #cbd5e1; margin-top: 8px; }
  </style>
  </head>
  <body>

    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px 12px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .corp-box strong { color: #1e3a8a; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">

        <div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Master Services Agreement (MSA)')}</h1>
          <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
          <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-04-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.executionDate ? doc.executionDate : (doc.date ? doc.date : '______________________'))}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'ibunify (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>

        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
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
          <div style="display:flex;gap:16px;margin-top:10px;">
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || doc.clientSignatory || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.clientSignatoryName || '___________________________')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || doc.leadSignatory || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.leadSignatoryName || doc.providerSignatoryName || 'Rama Krishna')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.leadSignatoryTitle || doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.leadSignDate ? doc.leadSignDate : (doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________')))}</div>
            </div>
          </div>
        </div>

        ${remainingSections.map((sec) => `
          <div>
            <div class="sec-title">${escapeHtml(sec.title)}</div>
            <div class="sec-text">${escapeHtml(sec.content || '').replaceAll('\n', '<br/>')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </body></html>`;
}

export function commercialProposalToHtml(doc, forWord = false) {
  return customProposalToHtml(doc, forWord);
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
    'Level 2 (Technical Lead): Rama Krishna (ramakrishna@iglobus.com)',
    'Level 3 (Practice Lead): Rama Krishna (ramakrishna@iglobuscc.com)'
  ];

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Service Level Agreement (SLA)')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: auto; margin-bottom: 0; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }

    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 14px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; table-layout: fixed; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10px; font-weight: 700; padding: 5px 8px; text-align: left; }
    .pipe-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
    .sign-box { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px 12px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 6px; border-top: 1px solid #cbd5e1; margin-top: 8px; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">

        <div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Service Level Agreement (SLA)')}</h1>
          <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
          <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-06-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.effectiveDate ? doc.effectiveDate : (doc.date ? doc.date : '______________________'))}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>

        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div>
          <div class="sec-title">1. SERVICE UPTIME & INFRASTRUCTURE COMMITMENT</div>
          <div class="sec-text">${escapeHtml(doc.uptimeCommitment || 'ibunify guarantees a minimum of 99.9% Platform Availability for core cloud telephony, CRM databases, and AI routing endpoints, excluding scheduled maintenance windows.')}</div>
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

        <div style="display:flex;gap:16px;margin-top:10px;">
          <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
            <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
            <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
            <div style="height:42px;"></div>
            <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
            <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.clientSignatoryName || '___________________________')}</div>
            <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
            <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
          </div>
          <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
            <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
            <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
            <div style="height:42px;"></div>
            <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
            <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.leadSignatoryName || doc.providerSignatoryName || 'Rama Krishna')}</div>
            <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.leadSignatoryTitle || doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
            <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.leadSignDate ? doc.leadSignDate : (doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________')))}</div>
          </div>
        </div>
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

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Purchase Order (PO Template)')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0 0 16px; }
    .p1-desc { font-size: 14px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }

    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .p2-top { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; }
    .p2-subbar { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 0.06em; margin-top: 8px; margin-bottom: 14px; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11.5px; margin-bottom: 10px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #e2e8f0; table-layout: fixed; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10.5px; font-weight: 700; padding: 5px 8px; border-right: 1px solid #1e3a8a; text-align: left; }
    .pipe-table td { padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: top; word-break: break-word; overflow-wrap: break-word; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
    .corp-box { text-align: center; font-size: 10.5px; color: #475569; padding: 8px 12px; background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; margin-top: 10px; }
    .corp-box strong { color: #1e3a8a; }
    .p2-foot { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; padding-top: 6px; border-top: 1px solid #cbd5e1; margin-top: 8px; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">

        <div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Purchase Order (PO Template)')}</h1>
          <div class="p1-subtitle">${escapeHtml(doc.subtitle || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
          <p class="p1-desc">${escapeHtml(doc.description || doc.descriptionText || 'Official enterprise documentation for platform deployment, legal governance, and operational handover.')}</p>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Document Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-07-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.poDate ? doc.poDate : (doc.date ? doc.date : '______________________'))}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>

        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div>
          <div class="sec-title">1. PURCHASE ORDER SUMMARY</div>
          <div class="summary-grid">
            <div><span style="color:#64748b;">PO Number: </span><strong style="color:#0f2b6e;">${escapeHtml(doc.poNumber || 'PO-ibunify-2026-001')}</strong></div>
            <div><span style="color:#64748b;">Payment Terms: </span><strong style="color:#0f2b6e;">${escapeHtml(doc.paymentTerms || 'NET 30')}</strong></div>
            <div><span style="color:#64748b;">PO Date: </span><strong style="color:#1e293b;">${escapeHtml(doc.poDate ? doc.poDate : '________________________')}</strong></div>
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
          <div style="display:flex;gap:16px;margin-top:10px;">
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || `ACCEPTED FOR: [${doc.issuedByClient || doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.issuedByAuthorized || doc.clientSignatoryName || '___________________________')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.issuedByDesignation || doc.clientSignatoryTitle || '____________________________')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.issuedByDate ? doc.issuedByDate : (doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________')))}</div>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.acceptedByAuthorized || doc.providerSignatoryName || 'Rama Krishna')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.acceptedByDesignation || doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.acceptedByDate ? doc.acceptedByDate : (doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________')))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;
}

export function handoverToHtml(doc, forWord = false) {
  const checklistItems = doc.handoverChecklistItems || [];
  const checklistRowsHtml = checklistItems
    .map(
      (item) => `
    <tr>
      <td style="padding:7px 10px;border:1px solid #cbd5e1;font-weight:700;color:#0f2b6e;">${escapeHtml(item.component)}</td>
      <td style="padding:7px 10px;border:1px solid #cbd5e1;color:#334155;">${escapeHtml(item.feature)}</td>
      <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:600;color:#047857;">${escapeHtml(item.status || 'Verified & Active')}</td>
    </tr>
  `
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Delivery & Handover')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 30px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-desc { font-size: 13.5px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: auto; margin-bottom: 0; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }
    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; table-layout: fixed; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10.5px; font-weight: 700; padding: 6px 8px; text-align: left; }
    .pipe-table td { padding: 6px 8px; font-size: 11.5px; line-height: 1.4; color: #334155; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">
        <div>
          <div class="p1-badge">${escapeHtml(doc.badge || 'OPERATIONAL HANDOVER & SIGN-OFF')}</div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Project Delivery & System Handover')}</h1>
          <div class="p1-desc">${escapeHtml(doc.description || 'Formal project delivery sign-off certifying platform readiness and operational handover.')}</div>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Ref: ${escapeHtml(doc.proposalNumber || 'IGC-HANDOVER-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.handoverDate ? doc.handoverDate : (doc.date ? doc.date : '______________________'))}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'ibunify (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div>
          <div class="sec-title">1. DELIVERY SCOPE VERIFICATION</div>
          <div class="sec-text">${escapeHtml(doc.scopeVerificationText || 'This Delivery & Handover Document certifies that the implementation of the ibunify CRM Platform has been completed in accordance with the Statement of Work.').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">2. HANDOVER CHECKLIST & VERIFICATION MATRIX</div>
          <table class="pipe-table">
            <thead>
              <tr>
                <th style="width:28%;">Component</th>
                <th style="width:44%;">Delivered Feature</th>
                <th style="width:28%;">Status</th>
              </tr>
            </thead>
            <tbody>${checklistRowsHtml}</tbody>
          </table>
        </div>

        <div>
          <div class="sec-title">3. FORMAL DELIVERY ACCEPTANCE</div>
          <div style="display:flex;gap:16px;margin-top:10px;">
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.clientSignatoryName || doc.clientAttention || '___________________________')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.providerSignatoryName || 'Rama Krishna')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________'))}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="p2-foot">
        <div>${escapeHtml(doc.proposalNumber || 'IGC-HANDOVER-2026')}</div>
        <div>Page 2 of 2</div>
      </div>
    </div>
  </body></html>`;
}

export function closureToHtml(doc, forWord = false) {
  const operationalMetrics = doc.operationalMetrics || [];
  const metricsRowsHtml = operationalMetrics
    .map(
      (item) => `
    <tr>
      <td style="padding:7px 10px;border:1px solid #cbd5e1;font-weight:700;color:#0f2b6e;">${escapeHtml(item.kpi)}</td>
      <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center;color:#334155;">${escapeHtml(item.target)}</td>
      <td style="padding:7px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:600;color:#047857;">${escapeHtml(item.achieved)}</td>
    </tr>
  `
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Project Closure Certificate')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 30px; font-weight: 800; line-height: 1.25; margin: 0 0 12px; color: #0f2b6e; }
    .p1-desc { font-size: 13.5px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: auto; margin-bottom: 0; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; }
    .p1-meta-val { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #0f2b6e; }
    .p1-meta-sub { font-size: 12.5px; color: #475569; line-height: 1.5; }
    
    .page-2 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 120px 44px 135px 44px; background: #fff; color: #1e293b; page-break-after: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
    .sec-title { font-size: 13.5px; font-weight: 800; color: #1e3a8a; margin: 12px 0 6px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 3px; display: inline-block; }
    .sec-text { font-size: 12px; line-height: 1.5; color: #334155; margin-bottom: 10px; }
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; table-layout: fixed; }
    .pipe-table th { background: #0f2b6e; color: #fff; font-size: 10.5px; font-weight: 700; padding: 6px 8px; text-align: left; }
    .pipe-table td { padding: 6px 8px; font-size: 11.5px; line-height: 1.4; color: #334155; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
    .sign-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; font-size: 11.5px; }
  </style>
  </head>
  <body>
    <div class="page-1">
      <img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="" />
      <div class="inner-content">
        <div>
          <div class="p1-badge">${escapeHtml(doc.badge || 'PROJECT CLOSURE & SIGN-OFF')}</div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Project Closure Certificate')}</h1>
          <div class="p1-desc">${escapeHtml(doc.description || 'Final project closure certification and sign-off on delivered milestones.')}</div>
        </div>
        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Company Name]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Ref: ${escapeHtml(doc.proposalNumber || 'IGC-CLOSURE-2026')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.closureDate ? doc.closureDate : (doc.date ? doc.date : '______________________'))}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.company || 'ibunify (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-2">
      <div>
        <div>
          <div class="sec-title">1. FORMAL PROJECT CLOSURE STATEMENT</div>
          <div class="sec-text">${escapeHtml(doc.formalClosureStatement || 'This Project Closure Certificate formally confirms that the Phase-I deployment of the ibunify CRM Platform for [Client Company Name] is complete and operational.').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">2. OPERATIONAL & PERFORMANCE METRICS</div>
          <table class="pipe-table">
            <thead>
              <tr>
                <th style="width:36%;">Key Performance Indicator (KPI)</th>
                <th style="width:32%;">Agreed Target</th>
                <th style="width:32%;">Achieved Value</th>
              </tr>
            </thead>
            <tbody>${metricsRowsHtml}</tbody>
          </table>
        </div>

        <div>
          <div class="sec-title">3. POST-DEPLOYMENT WARRANTY & SUPPORT</div>
          <div class="sec-text">${escapeHtml(doc.supportWarrantyText || 'Standard hypercare and SLA support are active as defined in the Service Level Agreement (SLA).').replaceAll('\n', '<br/>')}</div>
        </div>

        <div>
          <div class="sec-title">4. MUTUAL FINAL PROJECT SIGN-OFF</div>
          <div style="display:flex;gap:16px;margin-top:10px;">
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatoryHeader || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.clientSignatoryName || doc.clientAttention || '___________________________')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
            </div>
            <div style="flex:1;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;box-sizing:border-box;">
              <div style="font-weight:700;color:#0f2b6e;font-size:12.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatoryHeader || 'ACCEPTED FOR: ibunify (iGLOBUS)')}</div>
              <div style="font-size:10.5px;color:#64748b;margin-bottom:4px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
              <div style="height:42px;"></div>
              <div style="border-bottom:1px dashed #cbd5e1;margin-bottom:8px;"></div>
              <div style="margin-top:4px;font-size:11.5px;">Name: ${escapeHtml(doc.providerSignatoryName || 'Rama Krishna')}</div>
              <div style="margin-top:4px;font-size:11.5px;">Title: ${escapeHtml(doc.providerSignatoryTitle || 'Enterprise Practice Leads')}</div>
              <div style="margin-top:4px;font-size:11px;color:#64748b;">Date: ${escapeHtml(doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________'))}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="p2-foot">
        <div>${escapeHtml(doc.proposalNumber || 'IGC-CLOSURE-2026')}</div>
        <div>Page 2 of 2</div>
      </div>
    </div>
  </body></html>`;
}

export function customProposalToHtml(doc, forWord = false) {
  const metrics = doc.metrics || [
    { value: '< 1 Min', label: 'FIRST RESPONSE SPEED' },
    { value: '100%', label: 'LEAD ATTRIBUTION' },
    { value: '3x', label: 'FOLLOW-UP VELOCITY' },
    { value: '24/7', label: 'AI VOICE & CHAT' }
  ];

  const servicesOverview = doc.servicesOverview || [
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

  const aiCallingBullets = doc.aiCallingBullets || [
    'Instant Inbound & Outbound Follow-up: Automatically dials new digital inquiries within seconds or follows up on missed calls.',
    'Lead Qualification & Budget Mapping: Identifies project preferences, purchase timelines, unit configurations (2BHK/3BHK), and budget ranges.',
    'Intelligent Agent Handoff: Transfers hot, qualified prospects directly to human sales executives with full conversation transcripts.',
    '24/7 Availability & Multi-lingual Support: Ensures no inquiry goes unattended during late evenings, weekends, or holidays.'
  ];

  const aiCallingItems = doc.aiCallingItems || [
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

  const cloudTelephonyBullets = doc.cloudTelephonyBullets || [
    'Intelligent Call-to-Lead System: Inbound calls route to available agents first. Answering instantly triggers a lead profile in CRM.',
    'Dedicated Project Virtual Numbers: Assign unique tracking numbers for Meta Ads, Google Ads, hoardings, and portals.',
    'Hybrid After-Hours Routing: Automatically switches calls from the web system to sales agents\' mobile phones during non-office hours.',
    'Call Recording & CDR Analytics: Complete audit trail with secure storage, agent talk-time analytics, and disposition tagging.'
  ];

  const cloudTelephonyItems = doc.cloudTelephonyItems || [
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

  const whatsappBullets = doc.whatsappBullets || [
    'Instant Brochure & Price Sheet Dispatch: Automatically triggers WhatsApp brochures when leads submit inquiry forms.',
    'Automated Nurture Sequences: Triggers site-visit reminders, location pins, video walkthroughs, and payment milestone alerts.',
    'Unified Multi-Agent Inbox: Enables sales teams to chat with prospects from a single verified business number with full audit logs.',
    'Interactive Chatbot & Quick Replies: Pre-configured menus for instant responses to common buyer FAQs and project details.'
  ];

  const whatsappItems = doc.whatsappItems || [
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

  const commercialScheduleItems = doc.commercialScheduleItems || [
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

  const roadmapBullets = doc.roadmapBullets || [
    'Week 1 (Kick-off & Ingestion): Account creation, role hierarchy setup, Meta CAPI & Google Ads integration.',
    'Week 2 (Telephony & WhatsApp): Virtual numbers provisioning, WhatsApp Business API templates, and routing logic.',
    'Week 3 (AI Agent & Testing): AI conversational script configuration, call-to-lead testing, and sandbox validation.',
    'Week 4 (Training & Go-Live): Sales team enablement, admin runbooks, UAT sign-off, and live production rollout.',
    'Support & SLA Commitment: Priority 1 (Critical) incidents resolved in < 30 minutes; dedicated Customer Success Lead.'
  ];

  const termsBullets = doc.termsBullets || [
    'All prices are exclusive of applicable statutory GST / taxes (18%).',
    'Third-party usage (telephony minutes, WhatsApp message costs, AI calling) billed against actual wallet consumption.',
    'Invoices are payable within 30 days from date of submission (NET 30).'
  ];

  const headerLeft = doc.headerLeft || 'iBUNIFY CRM by iGLOBUS | Commercial & Services Proposal';
  const headerRight = doc.headerRight || 'www.ibunify.com';
  const pageFootnote = doc.pageFootnote || 'Confidential - iBUNIFY (iGLOBUS Corporate Consulting)';

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(doc.proposalTitle || 'Commercial & Technical Proposal')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
    .page-1 { width: 210mm; height: 297mm; box-sizing: border-box; padding: 135px 48px 145px 48px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .page-1 .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: fill; z-index: 0; }
    .page-1 .inner-content { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    .p1-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: #0f2b6e; }
    .p1-sublogo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #2563eb; margin-top: 2px; }
    .p1-badge { display: inline-block; padding: 6px 14px; border: 1px solid #bfdbfe; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px; background: #f0f7ff; color: #1e3a8a; }
    .p1-title { font-size: 32px; font-weight: 800; line-height: 1.25; margin: 0 0 10px; color: #0f2b6e; }
    .p1-subtitle { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0 0 14px; }
    .p1-desc { font-size: 13.5px; line-height: 1.6; color: #334155; max-width: 90%; }
    .p1-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 22px; border-radius: 10px; background: #f8fafc; border: 1px solid #cbd5e1; margin-top: auto; margin-bottom: 0; }
    .p1-meta-head { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; margin-bottom: 6px; }
    .p1-meta-val { font-size: 14.5px; font-weight: 700; margin-bottom: 3px; color: #0f2b6e; }
    .p1-meta-sub { font-size: 12px; color: #475569; line-height: 1.45; }
    
    .paper-page { width: 210mm; height: 297mm; box-sizing: border-box; padding: 34px 44px 28px 44px; background: #fff; color: #1e293b; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
    .paper-page:last-child { page-break-after: auto; }
    .paper-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 84px; font-weight: 900; color: rgba(15, 23, 42, 0.032); pointer-events: none; white-space: nowrap; z-index: 0; text-transform: uppercase; letter-spacing: 0.08em; }
    .paper-inner { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; }
    
    .p-top { display: flex; justify-content: space-between; font-size: 11px; color: #334155; padding-bottom: 6px; border-bottom: 1px solid #cbd5e1; margin-bottom: 12px; }
    .p-footnote { margin-top: auto; padding-top: 8px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b; }
    .sec-title { font-size: 12.5px; font-weight: 800; color: #1e3a8a; margin: 8px 0 4px; text-transform: uppercase; border-bottom: 2px solid #2563eb; padding-bottom: 2px; display: inline-block; }
    .sec-text { font-size: 11px; line-height: 1.45; color: #334155; margin-bottom: 6px; }
    
    .pipe-table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; table-layout: fixed; font-size: 10.5px; }
    .pipe-table th { background: #0f2b6e; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; }
    .pipe-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; vertical-align: middle; }
    .pipe-table tr:nth-child(even) td { background: #f8fafc; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 8px 0; }
    .metric-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 4px; text-align: center; }
    .metric-val { font-size: 16px; font-weight: 800; color: #0f2b6e; }
    .metric-lbl { font-size: 8.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 2px; }
    
    .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
    .breakdown-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin: 0; font-size: 10.5px; }
    .breakdown-title { font-weight: 700; color: #1e3a8a; font-size: 11px; margin-bottom: 2px; }
    .callout-box { background: #f0f7ff; border: 1px solid #bfdbfe; border-left: 3px solid #2563eb; padding: 7px 12px; border-radius: 4px; font-size: 11px; color: #1e3a8a; margin: 6px 0; }
    .bullet-item { font-size: 10.5px; line-height: 1.35; color: #334155; margin-bottom: 3px; }
    
    .sign-box { display: flex; gap: 14px; margin-top: 6px; }
    .sign-col { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 10.5px; }
    .sign-head { font-weight: 700; color: #0f2b6e; font-size: 11.5px; margin-bottom: 2px; }
    .sign-sub { font-size: 10px; color: #64748b; margin-bottom: 4px; }
    .sign-line { border-bottom: 1px dashed #cbd5e1; margin: 18px 0 6px; }
    
    .corp-box { background: #f0f7ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 6px 10px; text-align: center; font-size: 10px; color: #475569; line-height: 1.4; margin-top: 8px; }
  </style></head><body>

    <!-- PAGE 1: COVER -->
    <div class="page-1">
      ${SAMPLE_LETTERHEAD_BASE64 ? `<img src="${SAMPLE_LETTERHEAD_BASE64}" class="bg-img" alt="Letterhead" />` : ''}
      <div class="inner-content">
        <div>
          <div class="p1-logo">ibunify</div>
          <div class="p1-sublogo">CRM BY IGLOBUS</div>
        </div>

        <div>
          <div class="p1-badge">${escapeHtml(doc.badge || 'SPECIALIZED COMMERCIAL & TECHNICAL PROPOSAL')}</div>
          <h1 class="p1-title">${escapeHtml(doc.proposalTitle || 'Unified CRM, Communication & AI Sales Automation')}</h1>
          ${doc.subtitle ? `<div class="p1-subtitle">${escapeHtml(doc.subtitle)}</div>` : ''}
          <div class="p1-desc">${escapeHtml(doc.description || 'One Platform. Every Connection. Endless Growth. Connecting Meta Ads, Google Ads, Portals, Cloud Telephony, WhatsApp Business, and Conversational AI into one cohesive pipeline.')}</div>
        </div>

        <div class="p1-meta-grid">
          <div>
            <div class="p1-meta-head">PROPOSAL PREPARED FOR</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedFor || '[Client Enterprise / Jayabheri Group]')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.clientAttention || 'Attn: Project Sponsor / Sales Leadership')}</div>
            <div class="p1-meta-sub">Engagement: ${escapeHtml(doc.engagement || 'iBUNIFY Platform & Integrated Services Deployment')}</div>
            <div class="p1-meta-sub">Proposal Ref: ${escapeHtml(doc.proposalNumber || 'IGC-IBUNIFY-2026-088')}</div>
            <div class="p1-meta-sub">Date: ${escapeHtml(doc.date ? doc.date : '______________________')}</div>
          </div>
          <div>
            <div class="p1-meta-head">SERVICE PROVIDER</div>
            <div class="p1-meta-val">${escapeHtml(doc.preparedBy || doc.company || 'iBUNIFY (iGLOBUS Corporate Consulting)')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.companyAddress || 'Office: Madhapur, Opp. Raheja Mindspace, Hyderabad')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.portals || 'Portals: www.ibunify.com | www.iglobuscc.com')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.productLead || 'Product Lead: Ramya | Sohail')}</div>
            <div class="p1-meta-sub">${escapeHtml(doc.contacts || 'Product Owner: Rama Krishna | CTO')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGE 2: ABOUT PRODUCTS & SERVICES + AI CALLING -->
    <div class="paper-page">
      <div class="paper-watermark">iBUNIFY CRM</div>
      <div class="paper-inner">
        <div class="p-top">
          <span>${escapeHtml(headerLeft)}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(headerRight)}</span>
        </div>

        <div>
          <!-- Section 1 -->
          <div>
            <div class="sec-title">1. ABOUT PRODUCT & SERVICES: THE POWER OF UNIFICATION</div>
            <div class="sec-text">iBUNIFY is an enterprise-grade CRM, communication, and sales automation platform engineered by iGLOBUS Corporate Consulting. Built specifically for high-velocity sales and real estate operations, iBUNIFY solves the fragmentation between disparate marketing channels, delayed lead responses, and lack of follow-up ownership.</div>
            
            <div class="callout-box">
              <strong>Design Principle:</strong> Connect the core before adding complexity. Ingest every lead, route every conversation instantly, automate follow-ups, and track conversions end-to-end.
            </div>

            <div class="metrics-grid">
              ${metrics.map((m) => `
                <div class="metric-card">
                  <div class="metric-val">${escapeHtml(m.value)}</div>
                  <div class="metric-lbl">${escapeHtml(m.label)}</div>
                </div>
              `).join('')}
            </div>

            <div style="font-weight:700;font-size:11.5px;color:#0f2b6e;margin:8px 0 4px 0;">
              Integrated Platform Services Overview:
            </div>

            <div class="breakdown-grid">
              ${servicesOverview.map((s) => `
                <div class="breakdown-card">
                  <div class="breakdown-title">${escapeHtml(s.key)}. ${escapeHtml(s.title)}</div>
                  <div style="color:#334155;font-size:10px;line-height:1.35;">${escapeHtml(s.desc)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2 -->
          <div style="margin-top:6px;">
            <div class="sec-title">2. AI CALLING SERVICES & COSTING</div>
            <div class="sec-text" style="margin-bottom:3px;">iBUNIFY AI Agent Calling delivers automated, natural human-like voice conversations to qualify prospects, re-engage cold leads, and eliminate call latency:</div>
            <div>
              ${aiCallingBullets.map((b) => `<div class="bullet-item">• ${escapeHtml(b)}</div>`).join('')}
            </div>
            <table class="pipe-table">
              <thead>
                <tr><th style="width:32%;">SERVICE COMPONENT</th><th style="width:44%;">SCOPE & DELIVERABLES</th><th style="width:24%;text-align:right;">INVESTMENT (INR / ₹)</th></tr>
              </thead>
              <tbody>
                ${aiCallingItems.map((item) => `
                  <tr>
                    <td><strong>${escapeHtml(item.component)}</strong></td>
                    <td style="color:#475569;">${escapeHtml(item.scope)}</td>
                    <td style="text-align:right;font-weight:700;color:#1e3a8a;">${escapeHtml(item.investment)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="p-footnote">
          <span>${escapeHtml(pageFootnote)}</span>
          <span style="font-weight:600;color:#334155;">Page 2 of 3</span>
        </div>
      </div>
    </div>

    <!-- PAGE 3: TELEPHONY, WHATSAPP, COMMERCIALS, ROADMAP, TERMS & SIGN-OFF -->
    <div class="paper-page">
      <div class="paper-watermark">iBUNIFY CRM</div>
      <div class="paper-inner">
        <div class="p-top" style="padding-bottom:4px;margin-bottom:8px;">
          <span>${escapeHtml(headerLeft)}</span>
          <span style="color:#2563eb;font-weight:700;">${escapeHtml(headerRight)}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:4px;">
          <!-- Section 3 -->
          <div>
            <div class="sec-title" style="font-size:11px;margin:2px 0 2px;">3. CLOUD TELEPHONY SERVICES & COSTING</div>
            <div class="sec-text" style="font-size:9.5px;margin-bottom:2px;">Enterprise cloud telephony infrastructure integrated directly into the CRM to give complete control over lead communication:</div>
            <div>
              ${cloudTelephonyBullets.map((b) => `<div class="bullet-item" style="font-size:9px;line-height:1.25;margin-bottom:1px;">• ${escapeHtml(b)}</div>`).join('')}
            </div>
            <table class="pipe-table" style="font-size:9.5px;margin-top:2px;margin-bottom:3px;">
              <thead>
                <tr><th style="width:32%;padding:4px 6px;font-size:9px;">SERVICE COMPONENT</th><th style="width:44%;padding:4px 6px;font-size:9px;">SCOPE & DELIVERABLES</th><th style="width:24%;padding:4px 6px;font-size:9px;text-align:right;">INVESTMENT (INR / ₹)</th></tr>
              </thead>
              <tbody>
                ${cloudTelephonyItems.map((item) => `
                  <tr>
                    <td style="padding:3px 6px;font-size:9.5px;"><strong>${escapeHtml(item.component)}</strong></td>
                    <td style="padding:3px 6px;font-size:9px;color:#475569;">${escapeHtml(item.scope)}</td>
                    <td style="padding:3px 6px;font-size:9.5px;text-align:right;font-weight:700;color:#1e3a8a;">${escapeHtml(item.investment)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Section 4 -->
          <div>
            <div class="sec-title" style="font-size:11px;margin:2px 0 2px;">4. WHATSAPP AUTOMATION SERVICES & COSTING</div>
            <div class="sec-text" style="font-size:9.5px;margin-bottom:2px;">Official Meta WhatsApp Business Platform integration turning chat conversations into high-converting customer journeys:</div>
            <div>
              ${whatsappBullets.map((b) => `<div class="bullet-item" style="font-size:9px;line-height:1.25;margin-bottom:1px;">• ${escapeHtml(b)}</div>`).join('')}
            </div>
            <table class="pipe-table" style="font-size:9.5px;margin-top:2px;margin-bottom:3px;">
              <thead>
                <tr><th style="width:32%;padding:4px 6px;font-size:9px;">SERVICE COMPONENT</th><th style="width:44%;padding:4px 6px;font-size:9px;">SCOPE & DELIVERABLES</th><th style="width:24%;padding:4px 6px;font-size:9px;text-align:right;">INVESTMENT (INR / ₹)</th></tr>
              </thead>
              <tbody>
                ${whatsappItems.map((item) => `
                  <tr>
                    <td style="padding:3px 6px;font-size:9.5px;"><strong>${escapeHtml(item.component)}</strong></td>
                    <td style="padding:3px 6px;font-size:9px;color:#475569;white-space:pre-line;">${escapeHtml(item.scope)}</td>
                    <td style="padding:3px 6px;font-size:9.5px;text-align:right;font-weight:700;color:#1e3a8a;white-space:pre-line;">${escapeHtml(item.investment)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Section 5 -->
          <div>
            <div class="sec-title" style="font-size:11px;margin:2px 0 2px;">5. OVERALL COMMERCIAL INVESTMENT SCHEDULE</div>
            <table class="pipe-table" style="font-size:9.5px;margin-top:2px;margin-bottom:3px;">
              <thead>
                <tr><th style="width:34%;padding:4px 6px;font-size:9px;">INVESTMENT COMPONENT</th><th style="width:42%;padding:4px 6px;font-size:9px;">COMMERCIAL MODEL & INCLUSIONS</th><th style="width:24%;padding:4px 6px;font-size:9px;text-align:right;">INVESTMENT (INR / ₹)</th></tr>
              </thead>
              <tbody>
                ${commercialScheduleItems.map((item) => `
                  <tr>
                    <td style="padding:3px 6px;font-size:9.5px;"><strong>${escapeHtml(item.component)}</strong></td>
                    <td style="padding:3px 6px;font-size:9px;color:#475569;">${escapeHtml(item.scope)}</td>
                    <td style="padding:3px 6px;font-size:9.5px;text-align:right;font-weight:700;color:#1e3a8a;">${escapeHtml(item.investment)}</td>
                  </tr>
                `).join('')}
                <tr style="background:#f0f7ff;border-top:2px solid #2563eb;">
                  <td colspan="2" style="font-weight:800;color:#1e3a8a;padding:4px 6px;font-size:10px;">
                    Base Activation Package Total (Excl. Consumption & Lic.)
                  </td>
                  <td style="text-align:right;font-weight:800;color:#1e3a8a;padding:4px 6px;font-size:10.5px;">
                    ${escapeHtml(doc.baseActivationPackageTotal || doc.basePackageTotal || '₹75,000 + Wallet / Lic.')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Section 6 -->
          <div style="margin-top:8px;">
            <div class="sec-title" style="font-size:10.5px;margin:2px 0 2px;">6. IMPLEMENTATION ROADMAP & SLA</div>
            <div>
              ${roadmapBullets.map((b) => `<div class="bullet-item" style="font-size:8.5px;line-height:1.3;margin-bottom:1.5px;">• ${escapeHtml(b)}</div>`).join('')}
            </div>
          </div>

          <!-- Section 7 -->
          <div style="margin-top:8px;">
            <div class="sec-title" style="font-size:10.5px;margin:2px 0 2px;">7. TERMS & CONDITIONS</div>
            <div>
              ${termsBullets.map((b) => `<div class="bullet-item" style="font-size:8.5px;line-height:1.3;margin-bottom:1.5px;">• ${escapeHtml(b)}</div>`).join('')}
            </div>
          </div>

          <!-- Section 8: Acceptance & Sign-off -->
          <div style="margin-top:8px;">
            <div class="sec-title" style="font-size:10.5px;margin:2px 0 2px;">8. PROPOSAL ACCEPTANCE & SIGN-OFF</div>
            <div class="sec-text" style="font-size:9px;margin-bottom:4px;">Authorized representatives acknowledge and accept the scope, deliverables, and commercial terms set forth:</div>
            
            <div class="sign-box" style="gap:10px;margin-top:2px;">
              <div class="sign-col" style="padding:6px 10px;font-size:9px;border-radius:6px;">
                <div class="sign-head" style="font-size:10px;margin-bottom:1px;">${escapeHtml(doc.clientSignatoryHeader || `ACCEPTED FOR: [${doc.preparedFor || 'CLIENT ENTERPRISE'}]`)}</div>
                <div class="sign-sub" style="font-size:8.5px;margin-bottom:2px;">${escapeHtml(doc.clientSignatorySub || 'Authorized Signatory')}</div>
                <div class="sign-line" style="margin:14px 0 3px;"></div>
                <div>Name: ${escapeHtml(doc.clientSignatoryName || '___________________________')}</div>
                <div style="margin-top:2px;">Title: ${escapeHtml(doc.clientSignatoryTitle || '____________________________')}</div>
                <div style="margin-top:2px;color:#64748b;font-size:8.5px;">Date: ${escapeHtml(doc.clientSignDate ? doc.clientSignDate : (doc.date ? doc.date : '____________________________'))}</div>
              </div>
              <div class="sign-col" style="padding:6px 10px;font-size:9px;border-radius:6px;">
                <div class="sign-head" style="font-size:10px;margin-bottom:1px;">${escapeHtml(doc.providerSignatoryHeader || 'ACCEPTED FOR: iBUNIFY (iGLOBUS)')}</div>
                <div class="sign-sub" style="font-size:8.5px;margin-bottom:2px;">${escapeHtml(doc.providerSignatorySub || 'Authorized Signatory')}</div>
                <div class="sign-line" style="margin:14px 0 3px;"></div>
                <div>Name: ${escapeHtml(doc.providerSignatoryName || 'Rama Krishna')}</div>
                <div style="margin-top:2px;">Title: ${escapeHtml(doc.providerSignatoryTitle || 'CTO')}</div>
                <div style="margin-top:2px;color:#64748b;font-size:8.5px;">Date: ${escapeHtml(doc.providerSignDate ? doc.providerSignDate : (doc.date ? doc.date : '____________________________'))}</div>
              </div>
            </div>

            <div class="corp-box" style="margin-top:5px;padding:4px 8px;font-size:8.5px;line-height:1.3;">
              <div style="font-weight:700;color:#0f2b6e;">${escapeHtml(doc.corporateFooterCompany || 'iBUNIFY CRM by iGLOBUS Corporate Consulting')}</div>
              <div>${escapeHtml(doc.corporateFooterAddress || 'Madhapur, Opp. Raheja Mindspace, Hyderabad, Telangana, India – 500081')} | Contact: Rama Krishna | CTO (+91 78420 97496)</div>
            </div>
          </div>
        </div>

        <div class="p-footnote" style="padding-top:6px;">
          <span>${escapeHtml(pageFootnote)}</span>
          <span style="font-weight:600;color:#334155;">Page 3 of 3</span>
        </div>
      </div>
    </div>
  </body></html>`;
}

export function proposalToHtml(rawProposal, forWord = false) {
  const proposal = sanitizeProposalData(rawProposal) || {};
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
  return customProposalToHtml(proposal, forWord);
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
    downloadBlob(blob, 'ibunify-Overall-Proposal.pdf', 'application/pdf');
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
    document.querySelector('.custom-proposal-pages-container') ||
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
      '.sample-letterhead-paper, .standard-invoice-paper, .compact-invoice-paper, .discovery-cover-paper, .discovery-content-paper, .nda-cover-paper, .nda-content-paper, .msa-cover-paper, .msa-content-paper, .ctp-cover-paper, .ctp-content-paper, .sla-cover-paper, .sla-content-paper, .po-cover-paper, .po-content-paper, .handover-cover-paper, .handover-content-paper, .closure-cover-paper, .closure-content-paper, .custom-proposal-cover-paper, .custom-proposal-page-paper'
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
      return { valid: false, error: 'File is not a valid ibunify proposal/invoice JSON.' };
    }
    const sanitizedProposal = {
      ...data,
      id: data.id || `imported-${Date.now()}`,
      company: data.company || 'ibunify',
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
