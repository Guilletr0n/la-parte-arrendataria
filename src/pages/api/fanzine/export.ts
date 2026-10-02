import type { APIRoute } from 'astro';
import { generateFanzinePdf } from '../../../lib/pdf';

export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const origin = url.origin;
    const targetUrl = `${origin}/print/issue-preview`;

    console.log(`Generating PDF from: ${targetUrl}`);
    const pdfBuffer = await generateFanzinePdf(targetUrl);

    const filename = `fanzine-la-parte-arrendataria-${new Date().toISOString().split('T')[0]}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('PDF export failed:', err);
    return new Response(
      `<html><body style="font-family: monospace; padding: 2rem;">
        <h2>Error al generar el PDF del Fanzine con Puppeteer</h2>
        <p>${err.message}</p>
        <p>Puedes imprimir directamente desde el navegador en <a href="/print/issue-preview">/print/issue-preview</a> usando Ctrl+P / Cmd+P.</p>
      </body></html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
};
