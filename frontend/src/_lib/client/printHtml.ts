'use client';

/**
 * Renders a server-generated document (the invoice/offer HTML) in a hidden
 * iframe and opens the browser's print dialog, where "Save as PDF" is offered
 * on every desktop and mobile OS.
 *
 * This exists because the backend's Puppeteer PDF endpoint needs a Chromium
 * binary that the Railway image does not ship, so `pricings/../pdf` 500s.
 * Printing the same HTML the preview already renders keeps the document
 * identical without depending on the backend browser.
 */
export function printHtmlDocument(html: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { background: #fff; }
      body { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; }
      @page { size: A4; margin: 12mm; }
    </style>
  </head><body>${html}</body></html>`);
  doc.close();

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    try { document.body.removeChild(iframe); } catch { /* already gone */ }
  };

  iframe.contentWindow?.addEventListener('afterprint', cleanup);
  // Safari never fires afterprint for iframes, so the node would leak forever.
  setTimeout(cleanup, 60000);

  // Give the iframe a tick to lay the document out before printing, otherwise
  // Chrome can open the dialog against a blank page.
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      cleanup();
    }
  }, 300);
}
