'use client';

import { useEffect, useState } from 'react';
import { downloadPricing } from '../../work/actions/downloadPricing';
import Spinner from '@/_components/Spinner';

export default function InvoicePreviewFrame({ workId }: { workId: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await downloadPricing({ pricingId: workId, pricingName: 'invoice', downloadHtml: true });
        if (!cancelled && typeof result === 'string') {
          setHtml(result);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [workId]);

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-secondary p-8">
        <p className="text-sm text-muted-foreground">Could not load invoice preview.</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card p-16">
        <Spinner />
      </div>
    );
  }

  const wrappedHtml = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: white; }
        body { padding: 32px; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;

  const srcDoc = wrappedHtml;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Invoice Document Preview</span>
      </div>
      <iframe
        srcDoc={srcDoc}
        title="Invoice preview"
        className="w-full border-0"
        style={{ height: '842px', minHeight: '600px' }}
        sandbox="allow-same-origin"
      />
    </div>
  );
}
