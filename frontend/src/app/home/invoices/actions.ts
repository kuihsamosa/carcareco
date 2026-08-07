'use server'

import { httpDelete } from '@/_lib/server/query-api'
import { pushToast } from '@/_lib/server/pushToast'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Permanently removes invoices (and the work orders behind them).
 * The invoice numbers become free again, so a re-import will not skip them
 * as duplicates.
 */
export async function deleteInvoices(workIds: string[], redirectTo?: string) {
    if (workIds.length === 0) return

    const response = await httpDelete({
        url: 'invoices',
        body: workIds,
    })
    await response.text()

    await pushToast(
        workIds.length === 1 ? 'Invoice deleted.' : `${workIds.length} invoices deleted.`
    )
    revalidatePath('/home/invoices')

    // Deleting from the detail page would otherwise leave the user on a URL
    // that no longer resolves.
    if (redirectTo) redirect(redirectTo)
}
