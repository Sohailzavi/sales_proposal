import { generateUniversalDocumentHtml } from '../src/services/universalDocumentEngine.js';
import { renderHtmlToPdf } from './pdfRenderer.mjs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates sample items for automated testing.
 */
function createMockItems(count) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      id: `item-${i}`,
      description: `Service / Deliverable Item #${i} - Comprehensive System Integration and Verification Milestone`,
      detail: i % 2 === 0 ? `Sub-task documentation, telemetry metrics, and multi-tenant security verification module #${i}.` : '',
      qty: 1 + (i % 5),
      rate: 1500 * i
    });
  }
  return items;
}

const TEST_ROW_COUNTS = [1, 3, 5, 10, 11, 20, 50, 100];

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 RUNNING MANDATORY PLAYWRIGHT + CHROMIUM PAGINATION TEST SUITE');
  console.log('================================================================\n');

  const outDir = path.resolve('./test-output-pdfs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = [];

  for (const rowCount of TEST_ROW_COUNTS) {
    console.log(`▶ Testing Document with ${rowCount} rows...`);

    const proposal = {
      documentType: 'invoice',
      proposalTitle: `Official Invoice - Automated Test (${rowCount} Items)`,
      proposalNumber: `INV-TEST-${rowCount.toString().padStart(3, '0')}`,
      date: 'Nov 18, 2026',
      validUntil: 'Dec 18, 2026',
      paymentTerms: 'Net 30',
      company: 'iGlobus Corporate Consulting',
      companyMeta: 'Techno Enclave, Madhapur\nHyderabad, Telangana 500081',
      preparedFor: 'Enterprise Client Holdings Ltd.',
      clientAttention: 'Attention: Finance & Billing Directorate',
      clientAddress: 'Plot 42, Financial District, Nanakramguda\nHyderabad, Telangana 500032',
      currency: 'INR',
      cgstPct: 9,
      sgstPct: 9,
      invoiceItems: createMockItems(rowCount),
      notes: 'Payment by bank transfer to iGlobus Corporate Consulting, HDFC Bank, A/C 5010 2233 4455, IFSC HDFC0000123.'
    };

    const html = generateUniversalDocumentHtml(proposal);
    const pdfPath = path.join(outDir, `invoice_${rowCount}_rows.pdf`);
    const pdfBuffer = await renderHtmlToPdf(html, pdfPath);

    // Verify PDF using pdfjs-dist
    const uint8 = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8 });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    // Check every page text bounding box to ensure zero footer/header collision
    // A4 is 595.28 x 841.89 pt (or 794 x 1123 px)
    // Footer banner starts at bottom Y ~120pt from bottom
    let hasFooterCollision = false;
    let hasHeaderCollision = false;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      for (const item of textContent.items) {
        const textY = item.transform[5]; // Y coordinate from bottom in points
        // Reserved footer height in points is ~125pt from bottom (approx 44mm)
        // If content text sits below 110pt from bottom, it collides with the footer
        if (textY < 110) {
          hasFooterCollision = true;
          console.error(`  ❌ [FAIL] Page ${pageNum}: Text "${item.str}" collides with letterhead footer (Y=${textY.toFixed(1)}pt < 110pt)`);
        }
        // Reserved header height is top 105pt (Y > 745pt on 842pt page)
        if (pageNum > 1 && textY > 750) {
          hasHeaderCollision = true;
          console.error(`  ❌ [FAIL] Page ${pageNum}: Text "${item.str}" collides with letterhead header (Y=${textY.toFixed(1)}pt > 750pt)`);
        }
      }
    }

    const passed = !hasFooterCollision && !hasHeaderCollision;
    results.push({
      rows: rowCount,
      pages: pageCount,
      passed,
      pdfPath
    });

    console.log(`  ✔ Page Count: ${pageCount} pages | Footer Collision: ${hasFooterCollision} | Header Collision: ${hasHeaderCollision} | Status: ${passed ? 'PASSED ✅' : 'FAILED ❌'}\n`);
  }

  console.log('================================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY:');
  console.log('================================================================');
  console.table(results.map(r => ({
    'Rows': r.rows,
    'Total Pages': r.pages,
    'Status': r.passed ? 'PASSED ✅' : 'FAILED ❌',
    'Output PDF': path.basename(r.pdfPath)
  })));

  const allPassed = results.every(r => r.passed);
  if (!allPassed) {
    console.error('\n❌ TEST SUITE FAILED!');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 8 TEST MATRICES PASSED WITH ZERO COLLISIONS!');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
