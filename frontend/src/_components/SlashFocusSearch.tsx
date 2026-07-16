'use client'

import { useEffect } from 'react'

export default function SlashFocusSearch() {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
                e.preventDefault()
                const input = document.querySelector<HTMLInputElement>('input[name="searchText"]')
                input?.focus()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])
    return null
}
