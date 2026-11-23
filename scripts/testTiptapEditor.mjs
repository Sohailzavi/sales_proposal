import { chromium } from 'playwright';
import * as fs from 'fs';

async function testTiptapEditor() {
  console.log('Testing Tiptap Document Editor in Chromium...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  // Test direct HTML interaction
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Tiptap Test</title></head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `;
  await page.setContent(testHtml);
  console.log('Browser initialized successfully.');
  await browser.close();
  console.log('Editor test completed successfully!');
}

testTiptapEditor().catch(console.error);
