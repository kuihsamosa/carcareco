'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/20/solid';
import { downloadPricing } from '../../work/actions/downloadPricing';
import { printHtmlDocument } from '@/_lib/client/printHtml';
import Spinner from '@/_components/Spinner';

export default function InvoiceDownloadButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setFailed(false);
          try {
            const html = await downloadPricing({
              pricingId: id,
              pricingName: 'invoice',
              downloadHtml: true,
            }) as string;
            printHtmlDocument(html);
          } catch (e) {
            console.log('Invoice download failed', e);
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? <Spinner /> : <ArrowDownTrayIcon className="size-4" />}
        Download PDF
      </button>
      {failed && (
        <span className="text-[11px] text-destructive">Could not load the invoice. Try again.</span>
      )}
    </div>
  );
}
