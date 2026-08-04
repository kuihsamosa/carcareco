'use client'

import { useState, useCallback, useEffect, useRef, useTransition } from 'react'
import { createDirectInvoice } from './actions'
import { Reorder, useDragControls } from 'framer-motion'
import { TrashIcon, PlusIcon, Bars3Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Autosuggest from './Autosuggest'
import { dataPage, queryApi } from '@/_lib/client/query-api'

interface ISaleableSuggestion {
    code: string | null
    name: string
    price: number | null
}

interface IClientSuggestion {
    id: string
    name: string
    phone: string | null
}

interface IClientVehicle {
    id: string
    producer: string | null
    model: string | null
    regNr: string | null
    vin: string | null
}

function vehicleLabel(v: IClientVehicle): string {
    return [v.producer, v.model].filter(Boolean).join(' ').trim()
}

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

// A4 at 96dpi. CSS absolute units are exact (1mm = 96/25.4px), so the sheet on
// screen is the sheet that prints — no measuring or scaling needed.
const A4_WIDTH = '210mm'
const A4_HEIGHT = '297mm'
const A4_PADDING = '14mm'
const A4_HEIGHT_PX = 297 * 96 / 25.4

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
    const [clientPhone, setClientPhone] = useState('')
    // Set only when an existing client is picked; a typed-in name stays null and
    // the backend creates the client on save.
    const [clientId, setClientId] = useState<string | null>(null)
    const [clientVehicles, setClientVehicles] = useState<IClientVehicle[]>([])
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
    const paperRef = useRef<HTMLDivElement>(null)
    const [overflowsPage, setOverflowsPage] = useState(false)

    // Load draft from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const draft = JSON.parse(saved)
                if (draft.clientName) setClientName(draft.clientName)
                if (draft.clientPhone) setClientPhone(draft.clientPhone)
                if (draft.clientId) setClientId(draft.clientId)
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
                clientName, clientPhone, clientId,
                vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4,
                invoiceDate, isPaid, termsAndConditions, disclaimer, lines,
            }))
        } catch { /* ignore */ }
    }, [clientName, clientPhone, clientId, vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4, invoiceDate, isPaid, termsAndConditions, disclaimer, lines])

    // A picked client's vehicles back the vehicle autosuggest. Typed-in clients
    // have none, so that field simply stays free text.
    useEffect(() => {
        if (!clientId) { setClientVehicles([]); return }
        let cancelled = false
        queryApi<IClientVehicle[]>(`vehicles/client/${clientId}`)
            .then(v => { if (!cancelled) setClientVehicles(v ?? []) })
            .catch(() => { if (!cancelled) setClientVehicles([]) })
        return () => { cancelled = true }
    }, [clientId])

    const fetchClients = useCallback((searchText: string, deliver: (items: IClientSuggestion[]) => void) => {
        dataPage({
            resourceName: 'clients',
            searchText,
            whenReady: items => deliver(items as IClientSuggestion[]),
            onFailure: ({ url, status, text }) => console.log('Client autosuggest failed:', url, status, text),
        })
    }, [])

    const fetchVehicles = useCallback((searchText: string, deliver: (items: IClientVehicle[]) => void) => {
        const q = searchText.toLowerCase()
        deliver(clientVehicles.filter(v =>
            `${vehicleLabel(v)} ${v.regNr ?? ''} ${v.vin ?? ''}`.toLowerCase().includes(q)))
    }, [clientVehicles])

    const fetchSaleables = useCallback((searchText: string, deliver: (items: ISaleableSuggestion[]) => void) => {
        dataPage({
            resourceName: 'saleables',
            searchText,
            whenReady: items => deliver(items as ISaleableSuggestion[]),
            onFailure: () => {
                // Older backends expose only the raw parts table.
                dataPage({
                    resourceName: 'spareparts',
                    searchText,
                    whenReady: items => deliver(items as ISaleableSuggestion[]),
                    onFailure: ({ url, status, text }) => console.log('Item autosuggest failed:', url, status, text),
                })
            },
        })
    }, [])

    // Warn as soon as the content grows past a single sheet, rather than letting
    // it silently spill onto a second page at print time.
    useEffect(() => {
        const el = paperRef.current
        if (!el) return
        const check = () => setOverflowsPage(el.offsetHeight > A4_HEIGHT_PX + 1)
        check()
        const observer = new ResizeObserver(check)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const updateLine = useCallback((id: string, field: keyof LineItem, value: string | number) => {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    }, [])

    // Applying a suggestion sets the description and the price in one update, so
    // the two never render out of step. A suggestion without a known price
    // leaves whatever price is already on the line untouched.
    const applySuggestion = useCallback((id: string, item: ISaleableSuggestion) => {
        setLines(prev => prev.map(l => l.id === id
            ? { ...l, description: item.name, unitPrice: item.price ?? l.unitPrice }
            : l))
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
    }, [clientName, clientPhone, clientId, vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4, invoiceDate, isPaid, lines]) // eslint-disable-line react-hooks/exhaustive-deps

    const doSave = useCallback(() => {
        setShowNoClientConfirm(false)
        startTransition(async () => {
            await createDirectInvoice({
                clientId: clientId || undefined,
                clientName: clientName.trim() || undefined,
                clientPhone: clientPhone.trim() || undefined,
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
    }, [clientName, clientPhone, clientId, vehicleLine1, vehicleLine2, vehicleLine3, vehicleLine4, invoiceDate, isPaid, dueDays, lines])

    return (
        <div className="min-h-screen bg-neutral-950 py-8 px-4 flex flex-col items-center overflow-x-auto">
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: #fff; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Paper — exact A4, so what is edited here is what prints */}
            <div
                ref={paperRef}
                className="bg-card shadow-2xl rounded-sm relative shrink-0"
                style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    color: '#0f172a',
                    lineHeight: 1.5,
                    width: A4_WIDTH,
                    minHeight: A4_HEIGHT,
                    padding: A4_PADDING,
                }}
            >
                {/* Page boundary — only shown once the content runs past one sheet */}
                {overflowsPage && (
                    <div
                        aria-hidden
                        className="no-print"
                        style={{ position: 'absolute', left: 0, right: 0, top: A4_HEIGHT, borderTop: '1px dashed #f87171', pointerEvents: 'none' }}
                    >
                        <span style={{ position: 'absolute', right: 4, top: 4, fontSize: 9, color: '#ef4444', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            Page 2
                        </span>
                    </div>
                )}

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
                        <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, color: '#1e3a5f', textTransform: 'uppercase', margin: 0 }}>Invoice</p>
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
                        <Autosuggest<IClientSuggestion>
                            value={clientName}
                            placeholder="Client name"
                            inputStyle={{ ...docInputStyle, fontSize: 14, fontWeight: 600 }}
                            fetchItems={fetchClients}
                            primary={c => c.name}
                            secondary={c => c.phone}
                            onChange={v => { setClientName(v); setClientId(null) }}
                            onSelect={c => {
                                setClientName(c.name)
                                setClientId(c.id)
                                if (c.phone) setClientPhone(c.phone)
                            }}
                        />
                        <DocInput placeholder="Phone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
                    </div>
                    <div>
                        <p id="lbl-vehicle" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', margin: '0 0 8px' }}>Vehicle</p>
                        <Autosuggest<IClientVehicle>
                            value={vehicleLine1}
                            placeholder="Vehicle"
                            inputStyle={{ ...docInputStyle, fontSize: 14, fontWeight: 600 }}
                            minLength={0}
                            fetchItems={fetchVehicles}
                            primary={v => vehicleLabel(v) || (v.regNr ?? '')}
                            secondary={v => v.regNr}
                            onChange={setVehicleLine1}
                            onSelect={v => {
                                setVehicleLine1(vehicleLabel(v) || (v.regNr ?? ''))
                                if (v.regNr) setVehicleLine2(v.regNr)
                                if (v.vin) setVehicleLine4(v.vin)
                            }}
                        />
                        <DocInput placeholder="Plate number" value={vehicleLine2} onChange={e => setVehicleLine2(e.target.value)} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} />
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
                                fetchSaleables={fetchSaleables}
                                onUpdate={updateLine}
                                onApplySuggestion={applySuggestion}
                                onRemove={removeLine}
                                onMove={moveLine}
                                canRemove={lines.length > 1}
                            />
                        ))}
                    </Reorder.Group>
                </table>
                <button type="button" onClick={addLine} className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5E6AD2', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: '4px 0' }}>
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
            <div className="no-print fixed bottom-6 right-6 flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-xl px-5 py-3 shadow-2xl z-50">
                {overflowsPage && (
                    <>
                        <span className="flex items-center gap-1.5 text-xs text-amber-400" title="Remove or shorten lines to keep the invoice on one sheet">
                            <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                            Over one A4 page
                        </span>
                        <div className="w-px h-6 bg-neutral-700" />
                    </>
                )}
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

function LineItemRow({ line, currency, fetchSaleables, onUpdate, onApplySuggestion, onRemove, onMove, canRemove }: {
    line: LineItem
    currency: string
    fetchSaleables: (searchText: string, deliver: (items: ISaleableSuggestion[]) => void) => void
    onUpdate: (id: string, field: keyof LineItem, value: string | number) => void
    onApplySuggestion: (id: string, item: ISaleableSuggestion) => void
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
                <Autosuggest<ISaleableSuggestion>
                    value={line.description}
                    placeholder="Description"
                    inputStyle={{ ...docInputStyle, fontSize: 13, color: '#0f172a' }}
                    fetchItems={fetchSaleables}
                    primary={item => item.code ? `${item.name}  ${item.code}` : item.name}
                    secondary={item => item.price != null ? `${item.price.toFixed(2)} ${currency}` : null}
                    onChange={v => onUpdate(line.id, 'description', v)}
                    onSelect={item => onApplySuggestion(line.id, item)}
                    onAltMove={dir => onMove(line.id, dir)}
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
