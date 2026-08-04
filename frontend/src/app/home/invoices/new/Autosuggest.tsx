'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 200

/**
 * Inline autosuggest for the invoice paper. Free text is always allowed — a
 * value never has to match a suggestion. `fetchItems` receives a sequence-
 * guarded deliver callback, so stale responses are discarded by the caller's
 * own async transport.
 */
export default function Autosuggest<T>({
    value,
    placeholder,
    inputStyle,
    minLength = MIN_QUERY_LENGTH,
    fetchItems,
    primary,
    secondary,
    onChange,
    onSelect,
    onAltMove,
}: {
    value: string
    placeholder?: string
    inputStyle?: React.CSSProperties
    minLength?: number
    fetchItems: (searchText: string, deliver: (items: T[]) => void) => void
    primary: (item: T) => string
    secondary?: (item: T) => string | null
    onChange: (value: string) => void
    onSelect: (item: T) => void
    onAltMove?: (direction: -1 | 1) => void
}) {
    const [items, setItems] = useState<T[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(-1)

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const searchSeq = useRef(0)
    const skipNextSearch = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }, [])

    const handleChange = useCallback((next: string) => {
        onChange(next)

        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        if (skipNextSearch.current) {
            skipNextSearch.current = false
            return
        }

        if (next.trim().length < minLength) {
            searchSeq.current++
            setItems([])
            setIsOpen(false)
            return
        }

        const seq = ++searchSeq.current
        debounceTimer.current = setTimeout(() => {
            fetchItems(next.trim(), (results) => {
                if (seq !== searchSeq.current) return
                setItems(results)
                setHighlighted(results.length ? 0 : -1)
                setIsOpen(results.length > 0)
            })
        }, DEBOUNCE_MS)
    }, [onChange, fetchItems, minLength])

    const pick = useCallback((item: T) => {
        skipNextSearch.current = true
        searchSeq.current++
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        onSelect(item)
        setIsOpen(false)
        setItems([])
        setHighlighted(-1)
    }, [onSelect])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (onAltMove && e.altKey && e.key === 'ArrowUp') { e.preventDefault(); onAltMove(-1); return }
        if (onAltMove && e.altKey && e.key === 'ArrowDown') { e.preventDefault(); onAltMove(1); return }

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
    }, [isOpen, items, highlighted, onAltMove, pick])

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
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                style={inputStyle}
            />

            {isOpen && items.length > 0 && (
                <ul
                    role="listbox"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 40,
                        minWidth: 260,
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
                    {items.map((item, index) => {
                        const right = secondary?.(item)
                        return (
                            <li
                                key={`${primary(item)}-${index}`}
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
                                    {primary(item)}
                                </span>
                                {right && (
                                    <span style={{ fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        {right}
                                    </span>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
