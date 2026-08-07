'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/20/solid';
import { savePricingDocument } from '@/_lib/client/savePricingDocument';
import Spinner from '@/_components/Spinner';

export default function InvoiceDownloadButton({ id, number }: { id: string, number: string | number }) {
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
            await savePricingDocument({
              pricingId: id,
              pricingName: 'invoice',
              fileName: `invoice_${number}.pdf`,
            });
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
