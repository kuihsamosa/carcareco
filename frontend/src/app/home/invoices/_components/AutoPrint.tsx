'use client'

import { useEffect, useRef } from 'react'
import { downloadPricing } from '../../work/actions/downloadPricing'
import { printHtmlDocument } from '@/_lib/client/printHtml'

/**
 * Fires once after a new invoice is saved (`?print=1`). Prints the invoice
 * document itself — printing the page would capture the app chrome, breadcrumb
 * and preview iframe instead.
 */
export default function AutoPrint({ id }: { id: string }) {
    const fired = useRef(false)

    useEffect(() => {
        if (fired.current) return
        fired.current = true

        let cancelled = false
        ;(async () => {
            try {
                const html = await downloadPricing({
                    pricingId: id,
                    pricingName: 'invoice',
                    downloadHtml: true,
                }) as string
                if (!cancelled) printHtmlDocument(html)
            } catch (e) {
                console.log('Auto-print failed', e)
            }
        })()

        return () => { cancelled = true }
    }, [id])

    return null
}
