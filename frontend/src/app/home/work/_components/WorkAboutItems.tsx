'use client'

import { useState, useRef, useCallback } from 'react'
import { XMarkIcon, PlusIcon } from '@heroicons/react/20/solid'
import { dataPage } from '@/_lib/client/query-api'
import FormLabel from '@/_components/FormLabel'

interface IServiceItem {
    id: number
    name: string
}

interface ISparePart {
    code: string | null
    name: string
    price: number | null
}

function ServiceRow({
    item,
    onUpdate,
    onRemove,
}: {
    item: IServiceItem
    onUpdate: (id: number, name: string) => void
    onRemove: (id: number) => void
}) {
    const [query, setQuery] = useState(item.name)
    const [suggestions, setSuggestions] = useState<ISparePart[]>([])
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const search = useCallback((text: string) => {
        if (text.length < 2) { setSuggestions([]); setOpen(false); return }
        dataPage({
            resourceName: 'spareparts',
            searchText: text,
            whenReady: (items) => {
                const parts = (items as ISparePart[]).filter(x => x.name)
                setSuggestions(parts)
                setOpen(parts.length > 0)
            },
            onFailure: () => { setSuggestions([]); setOpen(false) }
        })
    }, [])

    return (
        <div ref={containerRef} className="relative flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    placeholder="Describe service or job..."
                    onChange={(e) => {
                        const val = e.target.value
                        setQuery(val)
                        onUpdate(item.id, val)
                        search(val)
                    }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
                    className="block w-full rounded-md bg-white py-1.5 px-3 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                />
                {open && suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-48 overflow-auto text-sm">
                        {suggestions.map((s, i) => (
                            <li
                                key={i}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    const name = s.name || s.code || ''
                                    setQuery(name)
                                    onUpdate(item.id, name)
                                    setOpen(false)
                                }}
                                className="px-3 py-2 cursor-pointer hover:bg-indigo-50 text-gray-900"
                            >
                                {s.name}
                                {s.code && <span className="ml-2 text-gray-400 text-xs">{s.code}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    )
}

export default function WorkAboutItems({ defaultValue }: { defaultValue?: string }) {
    const parseInitial = (notes?: string): IServiceItem[] => {
        if (!notes?.trim()) return [{ id: 0, name: '' }]
        return notes.split('\n').filter(x => x.trim()).map((name, i) => ({ id: i, name }))
    }

    const [items, setItems] = useState<IServiceItem[]>(parseInitial(defaultValue))
    const nextId = useRef(items.length)

    const joined = items.map(x => x.name).filter(x => x).join('\n')

    const addRow = () => {
        setItems(prev => [...prev, { id: nextId.current++, name: '' }])
    }

    const updateName = (id: number, name: string) => {
        setItems(prev => prev.map(x => x.id === id ? { ...x, name } : x))
    }

    const removeRow = (id: number) => {
        setItems(prev => prev.filter(x => x.id !== id))
    }

    return (
        <div>
            <FormLabel name="about" label="About" />
            <div className="mt-2 space-y-2">
                <textarea name="about" hidden readOnly value={joined} onChange={() => {}} />
                {items.map((item) => (
                    <ServiceRow
                        key={item.id}
                        item={item}
                        onUpdate={updateName}
                        onRemove={removeRow}
                    />
                ))}
                <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors mt-1"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add service
                </button>
            </div>
        </div>
    )
}
