'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { dataPage } from '@/_lib/client/query-api'

export interface ISaleableSuggestion {
    code: string | null
    name: string
    price: number | null
}

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 200

/**
 * Description cell with saleables autosuggest. Picking a suggestion fills the
 * price on the same line; the price input stays editable afterwards. Free text
 * is always allowed — a line does not have to match a known saleable.
 */
export default function DescriptionAutosuggest({
    value,
    currency,
    onChange,
    onSelect,
    onMove,
    inputStyle,
}: {
    value: string
    currency: string
    onChange: (value: string) => void
    onSelect: (item: ISaleableSuggestion) => void
    onMove: (direction: -1 | 1) => void
    inputStyle?: React.CSSProperties
}) {
    const [items, setItems] = useState<ISaleableSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(-1)

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Discards responses that arrive after a newer keystroke has been issued.
    const searchSeq = useRef(0)
    // Set when a suggestion is picked, so the resulting value change does not
    // immediately re-open the dropdown.
    const skipNextSearch = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }, [])

    const runSearch = useCallback((searchText: string, seq: number) => {
        const deliver = (results: ISaleableSuggestion[]) => {
            if (seq !== searchSeq.current) return
            setItems(results)
            setHighlighted(results.length ? 0 : -1)
            setIsOpen(results.length > 0)
        }

        dataPage({
            resourceName: 'saleables',
            searchText,
            whenReady: (results) => deliver(results as ISaleableSuggestion[]),
            onFailure: () => {
                // Older backends expose only the raw parts table.
                dataPage({
                    resourceName: 'spareparts',
                    searchText,
                    whenReady: (results) => deliver(results as ISaleableSuggestion[]),
                    onFailure: ({ url, status, text }) => {
                        console.log('Autosuggest failed:', url, status, text)
                        if (seq === searchSeq.current) setIsOpen(false)
                    },
                })
            },
        })
    }, [])

    const handleChange = useCallback((next: string) => {
        onChange(next)

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        if (skipNextSearch.current) {
            skipNextSearch.current = false
            return
        }

        if (next.trim().length < MIN_QUERY_LENGTH) {
            searchSeq.current++
            setItems([])
            setIsOpen(false)
            return
        }

        const seq = ++searchSeq.current
        debounceTimer.current = setTimeout(() => runSearch(next.trim(), seq), DEBOUNCE_MS)
    }, [onChange, runSearch])

    const pick = useCallback((item: ISaleableSuggestion) => {
        skipNextSearch.current = true
        searchSeq.current++
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        onSelect(item)
        setIsOpen(false)
        setItems([])
        setHighlighted(-1)
    }, [onSelect])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // Alt+Arrow reorders the line and must keep working while the list is open.
        if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); onMove(-1); return }
        if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); onMove(1); return }

        if (!isOpen || items.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted(i => (i + 1) % items.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted(i => (i - 1 + items.length) % items.length)
        } else if (e.key === 'Enter') {
            if (highlighted >= 0) {
                e.preventDefault()
                pick(items[highlighted])
            }
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setIsOpen(false)
        } else if (e.key === 'Tab') {
            setIsOpen(false)
        }
    }, [isOpen, items, highlighted, onMove, pick])

    // Close when focus or a click leaves the cell.
    useEffect(() => {
        if (!isOpen) return
        const onPointerDown = (e: PointerEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        return () => document.removeEventListener('pointerdown', onPointerDown)
    }, [isOpen])

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <input
                value={value}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => {
                    e.target.style.borderBottomColor = '#5E6AD2'
                    e.target.style.background = '#f8fafc'
                    if (items.length) setIsOpen(true)
                }}
                onBlur={e => {
                    e.target.style.borderBottomColor = 'transparent'
                    e.target.style.background = 'transparent'
                }}
                placeholder="Description"
                autoComplete="off"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="saleable-suggestions"
                aria-autocomplete="list"
                style={inputStyle}
            />

            {isOpen && items.length > 0 && (
                <ul
                    id="saleable-suggestions"
                    role="listbox"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 40,
                        minWidth: 320,
                        maxWidth: 460,
                        maxHeight: 240,
                        overflowY: 'auto',
                        margin: '2px 0 0',
                        padding: 4,
                        listStyle: 'none',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px -5px rgba(15,23,42,0.15), 0 4px 6px -4px rgba(15,23,42,0.1)',
                    }}
                >
                    {items.map((item, index) => (
                        <li
                            key={`${item.code ?? ''}-${item.name}-${index}`}
                            role="option"
                            aria-selected={index === highlighted}
                            onMouseEnter={() => setHighlighted(index)}
                            // pointerdown fires before the input's blur, so the click is not lost.
                            onPointerDown={e => { e.preventDefault(); pick(item) }}
                            style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '6px 8px',
                                borderRadius: 5,
                                cursor: 'pointer',
                                background: index === highlighted ? '#eef2ff' : 'transparent',
                            }}
                        >
                            <span style={{ fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.name}
                                {item.code && <span style={{ color: '#94a3b8', marginLeft: 6, fontSize: 11 }}>{item.code}</span>}
                            </span>
                            {item.price != null && (
                                <span style={{ fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                    {item.price.toFixed(2)} {currency}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
