'use client'

import { useEffect, useRef } from 'react'

/**
 * Drop this anywhere inside a data-entry <form> to stop the Enter key from
 * submitting the form while a single-line field is focused. Enter still works
 * in <textarea>, and on buttons/submit controls. Prevents accidental submits
 * and the "I pressed Enter and it saved/crashed" problem on the work, client
 * and vehicle forms.
 */
export default function PreventEnterSubmit() {
    const anchor = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const form = anchor.current?.closest('form')
        if (!form) return

        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Enter') return
            const target = e.target as HTMLElement | null
            if (!target) return
            const tag = target.tagName
            if (tag === 'TEXTAREA') return // allow newlines
            if (tag === 'BUTTON') return // allow activating buttons
            if (tag === 'INPUT' && (target as HTMLInputElement).type === 'submit') return
            if (tag === 'INPUT') e.preventDefault() // block implicit submit
        }

        form.addEventListener('keydown', handler)
        return () => form.removeEventListener('keydown', handler)
    }, [])

    return <span ref={anchor} className="hidden" aria-hidden="true" />
}
