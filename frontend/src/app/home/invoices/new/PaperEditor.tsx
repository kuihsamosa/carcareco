'use client'

import { useState, useCallback, useEffect, useRef, useTransition } from 'react'
import { createDirectInvoice } from './actions'
import { Reorder, useDragControls } from 'framer-motion'
import { TrashIcon, PlusIcon, Bars3Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface LineItem {
    id: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    discount: number
}

interface AppOptions {
    requisites: {
        name?: string
        tagline?: string
        address?: string
        address2?: string
        city?: string
        postcode?: string
        state?: string
        country?: string
        phone?: string
        email?: string
        website?: string
        bankAccount?: string
        regNr?: string
        kmkr?: string
        currency?: string
        logoBase64?: string
        logoContentType?: string
    }
    pricing: {
        invoice: {
            vatRate?: number
            surCharge?: string
            disclaimer?: string
            signatureLine?: boolean
            termsAndConditions?: string
            workshopSignatureBase64?: string
            invoiceNumberPrefix?: string
            dueDays?: number
        }
    }
}

const STORAGE_KEY = 'carcareco-draft-invoice'

function newLine(): LineItem {
    return { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'pcs', unitPrice: 0, discount: 0 }
}

function fmt(n: number, currency: string): string {
    return `${n.toFixed(2)} ${currency}`
}

export default function PaperEditor({ options }: { options: AppOptions }) {
    const req = options.requisites
    const inv = options.pricing?.invoice
    const currency = req.currency || 'MYR'
    const vatRate = inv?.vatRate ?? 0
    const taxMultiplier = 1 + vatRate / 100

    const [clientName, setClientName] = useState('')
    const [clientRegCode, setClientRegCode] = useState('')
    const [clientAddress, setClientAddress] = useState('')
    const [vehicleLine1, setVehicleLine1] = useState('')
    const [vehicleLine2, setVehicleLine2] = useState('')
    const [vehicleLine3, setVehicleLine3] = useState('')
    const [vehicleLine4, setVehicleLine4] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [isPaid, setIsPaid] = useState(true)
    const [termsAndConditions, setTermsAndConditions] = useState(inv?.termsAndConditions ?? '')
    const [disclaimer, setDisclaimer] = useState(inv?.disclaimer ?? '')
    const [lines, setLines] = useState<LineItem[]>([newLine()])
    const [showNoClientConfirm, setShowNoClientConfirm] = useState(false)
    const [isPending, startTransition] = useTransition()
    const draftLoaded = useRef(false)

    // Load draft from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const draft = JSON.parse(saved)
                if (draft.clientName) setClientName(draft.clientName)
                if (draft.clientRegCode) setClientRegCode(draft.clientRegCode)
                if (draft.clientAddress) setClientAddress(draft.clientAddress)
                if (draft.vehicleLine1) setVehicleLine1(draft.vehicleLine1)
                if (draft.vehicleLine2) setVehicleLine2(draft.vehicleLine2)
                if (draft.vehicleLine3) setVehicleLine3(draft.vehicleLine3)
                if (draft.vehicleLine4) setVehicleLine4(draft.vehicleLine4)
                if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate)
                if (draft.isPaid !== undefined) setIsPaid(draft.isPaid)
                if (draft.termsAndConditions) setTermsAndConditions(draft.termsAndConditions)
                if (draft.disclaimer) setDisclaimer(draft.disclaimer)
                if (draft.lines?.length) setLines(draft.lines)
            }
        } catch { /* ignore */ }
        draftLoaded.current = true
    }, [])

    // Save draft to localStorage
    useEffect(() => {
        if (!draftLoaded.current) return
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                clientName, clientRegCode, clientAddress,
                vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4,
                invoiceDate, isPaid, termsAndConditions, disclaimer, lines,
            }))
        } catch { /* ignore */ }
    }, [clientName, clientRegCode, clientAddress, vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4, invoiceDate, isPaid, termsAndConditions, disclaimer, lines])

    const updateLine = useCallback((id: string, field: keyof LineItem, value: string | number) => {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    }, [])

    const removeLine = useCallback((id: string) => {
        setLines(prev => prev.length <= 1 ? prev : prev.filter(l => l.id !== id))
    }, [])

    const addLine = useCallback(() => {
        setLines(prev => [...prev, newLine()])
    }, [])

    const moveLine = useCallback((id: string, direction: -1 | 1) => {
        setLines(prev => {
            const idx = prev.findIndex(l => l.id === id)
            const target = idx + direction
            if (target < 0 || target >= prev.length) return prev
            const next = [...prev]
            ;[next[idx], next[target]] = [next[target], next[idx]]
            return next
        })
    }, [])

    const totalExVat = lines.reduce((sum, l) => {
        const sub = l.quantity * l.unitPrice
        return sum + sub - sub * l.discount / 100
    }, 0)
    const totalInclVat = totalExVat * taxMultiplier
    const vatAmount = totalInclVat - totalExVat
    const hasDiscounts = lines.some(l => l.discount > 0)

    const dueDays = inv?.dueDays ?? 30
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + dueDays)

    const hasLogo = !!req.logoBase64 && !!req.logoContentType

    const cityLine = [req.city, req.postcode, req.state].filter(Boolean).join(', ')

    const handleSave = useCallback(() => {
        if (!clientName.trim()) {
            setShowNoClientConfirm(true)
            return
        }
        doSave()
    }, [clientName, clientRegCode, clientAddress, vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4, invoiceDate, isPaid, lines]) // eslint-disable-line react-hooks/exhaustive-deps

    const doSave = useCallback(() => {
        setShowNoClientConfirm(false)
        startTransition(async () => {
            await createDirectInvoice({
                clientName: clientName.trim() || undefined,
                clientAddress: clientAddress.trim() || undefined,
                clientRegCode: clientRegCode.trim() || undefined,
                vehicleLine1: vehicleLine1.trim() || undefined,
                vehicleLine2: vehicleLine2.trim() || undefined,
                vehicleLine3: vehicleLine3.trim() || undefined,
                vehicleLine4: vehicleLine4.trim() || undefined,
                invoiceDate,
                isPaid,
                dueDays,
                lines: lines.filter(l => l.description.trim()).map(l => ({
                    description: l.description,
                    quantity: l.quantity,
                    unit: l.unit,
                    unitPrice: l.unitPrice,
                    discount: l.discount,
                })),
            })
            localStorage.removeItem(STORAGE_KEY)
        })
    }, [clientName, clientRegCode, clientAddress, vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4, invoiceDate, isPaid, dueDays, lines])

    return (
        <div className="min-h-screen bg-neutral-950 py-8 px-4 flex flex-col items-center">
            {/* Paper */}
            <div className="bg-card w-full max-w-[794px] shadow-2xl rounded-sm p-10 md:p-14 relative" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#0f172a', lineHeight: 1.5 }}>

                {/* DRAFT badge */}
                <div style={{ position: 'absolute', top: 24, right: 24, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Draft
                </div>

                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        {hasLogo && (
                            <img src={`data:${req.logoContentType};base64,${req.logoBase64}`} alt={req.name} style={{ height: 56, width: 'auto', maxWidth: 180, objectFit: 'contain' }} />
                        )}
                        <div>
                            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{req.name}</p>
                            {req.tagline && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{req.tagline}</p>}
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
                                {req.address && <>{req.address}{req.address2 && `, ${req.address2}`}<br /></>}
                                {cityLine && <>{cityLine}{req.country && `, ${req.country}`}<br /></>}
                                {req.phone && <>{req.phone}<br /></>}
                                {req.email}{req.website && ` · ${req.website}`}
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#1e3a5f', textTransform: 'uppercase', margin: 0 }}>Tax Invoice</p>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.7 }}>
                            Date: <DocInput type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={{ width: 130 }} /><br />
                            Due: {dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '20px 0' }} />

                {/* Parties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    <div>
                        <p id="lbl-billto" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', margin: '0 0 8px' }}>Bill to</p>
                        <DocInput placeholder="Client name" value={clientName} onChange={e => setClientName(e.target.value)} aria-labelledby="lbl-billto" style={{ fontSize: 14, fontWeight: 600 }} />
                        <DocInput placeholder="Reg. code" value={clientRegCode} onChange={e => setClientRegCode(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
                        <DocInput placeholder="Address" value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
                    </div>
                    <div>
                        <p id="lbl-vehicle" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', margin: '0 0 8px' }}>Vehicle</p>
                        <DocInput placeholder="Vehicle line 1" value={vehicleLine1} onChange={e => setVehicleLine1(e.target.value)} aria-labelledby="lbl-vehicle" style={{ fontSize: 14, fontWeight: 600 }} />
                        <DocInput placeholder="Reg nr" value={vehicleLine2} onChange={e => setVehicleLine2(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
                        <DocInput placeholder="Odometer" value={vehicleLine3} onChange={e => setVehicleLine3(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
                        <DocInput placeholder="VIN" value={vehicleLine4} onChange={e => setVehicleLine4(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
                    </div>
                </div>

                {/* Line items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Description</th>
                            <th style={{ ...thStyle, textAlign: 'right', width: 60 }}>Qty</th>
                            <th style={{ ...thStyle, textAlign: 'right', width: 60 }}>Unit</th>
                            <th style={{ ...thStyle, textAlign: 'right', width: 100 }}>Unit Price</th>
                            <th style={{ ...thStyle, textAlign: 'right', width: 60 }}>Disc.%</th>
                            <th style={{ ...thStyle, textAlign: 'right', width: 100 }}>Amount</th>
                            <th style={{ ...thStyle, width: 60 }}></th>
                        </tr>
                    </thead>
                    <Reorder.Group as="tbody" axis="y" values={lines} onReorder={setLines}>
                        {lines.map(line => (
                            <LineItemRow
                                key={line.id}
                                line={line}
                                currency={currency}
                                onUpdate={updateLine}
                                onRemove={removeLine}
                                onMove={moveLine}
                                canRemove={lines.length > 1}
                            />
                        ))}
                    </Reorder.Group>
                </table>
                <button type="button" onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5E6AD2', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: '4px 0' }}>
                    <PlusIcon style={{ width: 14, height: 14 }} /> Add line
                </button>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <div style={{ width: 260 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                            <span>Subtotal</span>
                            <span style={{ fontWeight: 500, color: '#334155' }}>{fmt(totalExVat, currency)}</span>
                        </div>
                        {hasDiscounts && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#64748b' }}>
                                <span>Discount</span>
                                <span style={{ fontWeight: 500, color: '#334155' }}>included</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                            <span>VAT{vatRate > 0 ? ` (${vatRate}%)` : ''}</span>
                            <span style={{ fontWeight: 500, color: '#334155' }}>{fmt(vatAmount, currency)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 8, borderTop: '2px solid #0f172a', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            <span>Total Due</span>
                            <span>{fmt(totalInclVat, currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment details */}
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0 16px' }} />
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', margin: '0 0 10px' }}>Payment Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                        {req.bankAccount && <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><span style={{ color: '#94a3b8' }}>Bank account:</span> {req.bankAccount}</p>}
                        <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><span style={{ color: '#94a3b8' }}>Payment method:</span> {isPaid ? 'Cash' : 'Bank transfer'}</p>
                    </div>
                    <div>
                        {inv?.surCharge && <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><span style={{ color: '#94a3b8' }}>Late fee:</span> {inv.surCharge}</p>}
                        {req.regNr && <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><span style={{ color: '#94a3b8' }}>SSM Reg:</span> {req.regNr}</p>}
                        {req.kmkr && <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}><span style={{ color: '#94a3b8' }}>SST No:</span> {req.kmkr}</p>}
                    </div>
                </div>

                {/* Terms */}
                {(inv?.termsAndConditions || termsAndConditions) && (
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', margin: '0 0 8px' }}>Terms & Conditions</p>
                        <textarea
                            value={termsAndConditions}
                            onChange={e => setTermsAndConditions(e.target.value)}
                            rows={3}
                            style={{ ...docInputStyle, fontSize: 11, color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.6, width: '100%', resize: 'vertical' }}
                        />
                    </div>
                )}

                {/* Disclaimer */}
                {(inv?.disclaimer || disclaimer) && (
                    <textarea
                        value={disclaimer}
                        onChange={e => setDisclaimer(e.target.value)}
                        rows={2}
                        style={{ ...docInputStyle, marginTop: 12, fontSize: 10, color: '#94a3b8', width: '100%', resize: 'vertical', lineHeight: 1.5 }}
                    />
                )}

                {/* Signatures */}
                {inv?.signatureLine && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginTop: 40 }}>
                        <div style={{ paddingTop: 12, borderTop: '1px solid #94a3b8' }}>
                            <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Issued By</p>
                            {inv.workshopSignatureBase64 && (
                                <img src={`data:image/png;base64,${inv.workshopSignatureBase64}`} alt="Workshop signature" style={{ maxHeight: 48, maxWidth: 160, objectFit: 'contain', marginTop: 8 }} />
                            )}
                        </div>
                        <div style={{ paddingTop: 12, borderTop: '1px solid #94a3b8' }}>
                            <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Received By</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 32, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                    <div>
                        <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0' }}>{req.name}</p>
                        {req.address && <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0' }}>{req.address}</p>}
                        {req.email && <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0' }}>{req.email}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {req.bankAccount && <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0' }}>{req.bankAccount}</p>}
                        {req.regNr && <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0' }}>SSM: {req.regNr}</p>}
                        {req.kmkr && <p style={{ fontSize: 10, color: '#94a3b8', margin: '1px 0' }}>SST: {req.kmkr}</p>}
                    </div>
                </footer>
            </div>

            {/* Floating action bar */}
            <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-5 py-3 shadow-2xl z-50">
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer select-none">
                    <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                    Paid
                </label>
                <div className="w-px h-6 bg-neutral-700" />
                <Link href="/home/invoices" className="text-sm text-neutral-400 hover:text-neutral-200 px-3 py-1.5">Cancel</Link>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="bg-primary hover:bg-primary/100 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                    {isPending ? 'Saving…' : 'Save & Print'}
                </button>
            </div>

            {/* No-client confirmation dialog */}
            {showNoClientConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setShowNoClientConfirm(false)}>
                    <div className="bg-card rounded-xl p-6 max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 shrink-0" />
                            <h3 className="font-semibold text-neutral-900">Save without a client?</h3>
                        </div>
                        <p className="text-sm text-neutral-600 mb-5">You can add one later from the invoice detail page.</p>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowNoClientConfirm(false)} className="text-sm text-neutral-500 hover:text-neutral-700 px-3 py-1.5">Cancel</button>
                            <button type="button" onClick={doSave} disabled={isPending} className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                                {isPending ? 'Saving…' : 'Save anyway'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Transparent input that looks like document text until focused
const docInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid transparent',
    outline: 'none',
    padding: '2px 4px',
    margin: '-2px -4px',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
}

function DocInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { style, ...rest } = props
    return (
        <input
            {...rest}
            style={{ ...docInputStyle, ...style }}
            onFocus={e => {
                e.target.style.borderBottomColor = '#5E6AD2'
                e.target.style.background = '#f8fafc'
            }}
            onBlur={e => {
                e.target.style.borderBottomColor = 'transparent'
                e.target.style.background = 'transparent'
            }}
        />
    )
}

const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    borderBottom: '2px solid #0f172a',
    textAlign: 'left',
}

const tdStyle: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: 13,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
}

function LineItemRow({ line, currency, onUpdate, onRemove, onMove, canRemove }: {
    line: LineItem
    currency: string
    onUpdate: (id: string, field: keyof LineItem, value: string | number) => void
    onRemove: (id: string) => void
    onMove: (id: string, dir: -1 | 1) => void
    canRemove: boolean
}) {
    const dragControls = useDragControls()
    const amount = (() => {
        const sub = line.quantity * line.unitPrice
        return sub - sub * line.discount / 100
    })()

    return (
        <Reorder.Item as="tr" value={line} dragListener={false} dragControls={dragControls} style={{ ...tdStyle, cursor: 'default' }}>
            <td style={tdStyle}>
                <input
                    value={line.description}
                    onChange={e => onUpdate(line.id, 'description', e.target.value)}
                    placeholder="Description"
                    style={{ ...docInputStyle, fontSize: 13, color: '#0f172a' }}
                    onFocus={e => { e.target.style.borderBottomColor = '#5E6AD2'; e.target.style.background = '#f8fafc' }}
                    onBlur={e => { e.target.style.borderBottomColor = 'transparent'; e.target.style.background = 'transparent' }}
                    onKeyDown={e => {
                        if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); onMove(line.id, -1) }
                        if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); onMove(line.id, 1) }
                    }}
                />
            </td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>
                <input type="number" min={0} step="any" value={line.quantity} onChange={e => onUpdate(line.id, 'quantity', parseFloat(e.target.value) || 0)} style={{ ...docInputStyle, fontSize: 13, textAlign: 'right', width: 50 }} onFocus={e => { e.target.style.borderBottomColor = '#5E6AD2'; e.target.style.background = '#f8fafc' }} onBlur={e => { e.target.style.borderBottomColor = 'transparent'; e.target.style.background = 'transparent' }} />
            </td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>
                <input value={line.unit} onChange={e => onUpdate(line.id, 'unit', e.target.value)} style={{ ...docInputStyle, fontSize: 13, textAlign: 'right', width: 45 }} onFocus={e => { e.target.style.borderBottomColor = '#5E6AD2'; e.target.style.background = '#f8fafc' }} onBlur={e => { e.target.style.borderBottomColor = 'transparent'; e.target.style.background = 'transparent' }} />
            </td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>
                <input type="number" min={0} step="any" value={line.unitPrice} onChange={e => onUpdate(line.id, 'unitPrice', parseFloat(e.target.value) || 0)} style={{ ...docInputStyle, fontSize: 13, textAlign: 'right', width: 80, fontVariantNumeric: 'tabular-nums' }} onFocus={e => { e.target.style.borderBottomColor = '#5E6AD2'; e.target.style.background = '#f8fafc' }} onBlur={e => { e.target.style.borderBottomColor = 'transparent'; e.target.style.background = 'transparent' }} />
            </td>
            <td style={{ ...tdStyle, textAlign: 'right' }}>
                <input type="number" min={0} max={100} step="any" value={line.discount} onChange={e => onUpdate(line.id, 'discount', parseFloat(e.target.value) || 0)} style={{ ...docInputStyle, fontSize: 13, textAlign: 'right', width: 45 }} onFocus={e => { e.target.style.borderBottomColor = '#5E6AD2'; e.target.style.background = '#f8fafc' }} onBlur={e => { e.target.style.borderBottomColor = 'transparent'; e.target.style.background = 'transparent' }} />
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(amount, currency)}
            </td>
            <td style={{ ...tdStyle, textAlign: 'center' }}>
                <span onPointerDown={e => dragControls.start(e)} style={{ cursor: 'grab', touchAction: 'none', marginRight: 4, display: 'inline-block' }} aria-label="Drag to reorder">
                    <Bars3Icon style={{ width: 14, height: 14, color: '#94a3b8' }} />
                </span>
                {canRemove && (
                    <button type="button" onClick={() => onRemove(line.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }} aria-label="Remove line">
                        <TrashIcon style={{ width: 14, height: 14, color: '#ef4444' }} />
                    </button>
                )}
            </td>
        </Reorder.Item>
    )
}
