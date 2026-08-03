'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function SearchBox({ defaultValue }: { defaultValue: string }) {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function handleChange(value: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            if (value.trim()) {
                router.push(`/home/search?q=${encodeURIComponent(value.trim())}`)
            } else {
                router.push('/home/search')
            }
        }, 350)
    }

    return (
        <div className="relative mb-6">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
                ref={inputRef}
                type="search"
                placeholder="Search work orders, invoices, clients, vehicles…"
                defaultValue={defaultValue}
                onChange={e => handleChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
    )
}
