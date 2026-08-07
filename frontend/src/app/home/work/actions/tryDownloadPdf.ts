'use server';

import { getJwt } from '@/_lib/server/session';

/**
 * Fetches the server-rendered PDF, returning base64 — or null if the backend
 * cannot produce one.
 *
 * Deliberately does not go through `httpGet`: that helper redirects to /error
 * on any non-OK response, which would navigate the whole page away instead of
 * letting the caller fall back to printing the HTML. Binary is base64-encoded
 * because Blobs and ArrayBuffers do not survive the server-action boundary.
 */
export async function tryDownloadPdf({
    pricingId,
    pricingName,
}: {
    pricingId: string,
    pricingName: string,
}): Promise<string | null> {
    const TIMEOUT = Symbol('timeout');

    try {
        const jwt = await getJwt();
        const url = `${process.env.API_URL}/api/pricings/${pricingName}/${pricingId}/pdf`;

        // A cold Chromium start is slow, but the caller has a working fallback,
        // so give up rather than leave the user watching a spinner.
        const result = await Promise.race([
            fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + jwt,
                },
                cache: 'no-store',
            }),
            new Promise<typeof TIMEOUT>((resolve) => setTimeout(() => resolve(TIMEOUT), 45000)),
        ]);

        if (result === TIMEOUT) {
            console.log(`PDF generation timed out for ${pricingName}/${pricingId}`);
            return null;
        }

        if (!result.ok) {
            console.log(`PDF endpoint returned ${result.status} for ${pricingName}/${pricingId}`);
            return null;
        }

        const buffer = await result.arrayBuffer();
        if (buffer.byteLength === 0) return null;

        return Buffer.from(buffer).toString('base64');
    } catch (e) {
        console.log('PDF download failed, caller should fall back to print', e);
        return null;
    }
}
