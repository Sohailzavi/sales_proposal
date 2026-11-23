import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Universal PDF Generator using Playwright & Chromium.
 * Produces real, native A4 PDF binaries according to standard W3C CSS Paged Media.
 */
export async function renderHtmlToPdf(htmlString, outputPath = null) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  };

  if (fs.existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 }
    });

    await page.setContent(htmlString, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, pdfBuffer);
    }

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
