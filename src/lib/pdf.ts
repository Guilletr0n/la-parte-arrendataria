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

    // Set viewport for high quality editorial printing in A4 landscape (297mm x 210mm)
    await page.setViewport({ width: 1680, height: 1190, deviceScaleFactor: 2 });

    // Navigate to the print preview page
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Emulate print media for CSS @media print
    await page.emulateMediaType('print');

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
