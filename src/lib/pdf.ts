import puppeteer, { type Browser } from 'puppeteer';

export async function generateFanzinePdf(targetUrl: string): Promise<Buffer> {
  let browser: Browser | null = null;
  try {
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=medium',
      ],
    };

    // Use system chromium if defined (crucial for Docker / Cloud Run)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Set viewport for high quality editorial printing
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Navigate to the print preview page
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Emulate print media for CSS @media print
    await page.emulateMediaType('print');

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '15mm',
        left: '10mm',
        right: '10mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 8pt; width: 100%; display: flex; justify-content: space-between; border-top: 1px solid #000; padding: 4px 10mm 0 10mm; color: #222;">
          <span>LA PARTE ARRENDATARIA — EDICIÓN IMPRESA POPULAR</span>
          <span>PÁGINA <span class="pageNumber"></span> DE <span class="totalPages"></span></span>
        </div>
      `,
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
