'use client';

import { tryDownloadPdf } from '@/app/home/work/actions/tryDownloadPdf';
import { downloadPricing } from '@/app/home/work/actions/downloadPricing';
import { printHtmlDocument } from './printHtml';

export type SaveOutcome = 'pdf' | 'print';

/**
 * Saves an invoice or offer, preferring a real PDF file.
 *
 * The backend renders PDFs with headless Chromium, which is only available once
 * the API image ships a browser. When that endpoint cannot deliver, this falls
 * back to printing the same HTML the preview already uses, where the browser's
 * own "Save as PDF" finishes the job. Returns which path was taken so the UI
 * can explain itself.
 */
export async function savePricingDocument({
    pricingId,
    pricingName,
    fileName,
}: {
    pricingId: string,
    pricingName: string,
    fileName: string,
}): Promise<SaveOutcome> {
    const base64 = await tryDownloadPdf({ pricingId, pricingName });

    if (base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return 'pdf';
    }

    const html = await downloadPricing({
        pricingId,
        pricingName,
        downloadHtml: true,
    }) as string;
    printHtmlDocument(html);
    return 'print';
}
