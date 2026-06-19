'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { queryApi, patchApi } from '@/_lib/client/query-api'
import { formatMoney } from '@/_lib/format'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SalesPeriod {
  period: number
  label: string
  invoiceCount: number
  totalBilled: number
  totalPaid: number
  totalOutstanding: number
}

interface SalesTotals {
  invoiceCount: number
  totalBilled: number
  totalPaid: number
  totalOutstanding: number
}

interface SalesInvoiceRow {
  workId: string
  invoiceNumber: number
  issuedOn: string
  customerName: string
  vehicleLine: string
  isPaid: boolean
  total: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = formatMoney

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface TooltipEntry { dataKey: string; value: number }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string }

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const paid = payload.find((p) => p.dataKey === 'totalPaid')?.value ?? 0
  const outstanding = payload.find((p) => p.dataKey === 'totalOutstanding')?.value ?? 0
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-indigo-600">Paid: {fmt(paid)}</p>
      <p className="text-amber-500">Outstanding: {fmt(outstanding)}</p>
      <p className="text-gray-600 border-t mt-1 pt-1">Total: {fmt(paid + outstanding)}</p>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SalesTracker() {
  const now = new Date()
  const [years, setYears] = useState<number[]>([])
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)   // 1-12; 0 = year view
  const [chartData, setChartData] = useState<SalesPeriod[]>([])
  const [totals, setTotals] = useState<SalesTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [drillDay, setDrillDay] = useState<number | null>(null)
  const [invoices, setInvoices] = useState<SalesInvoiceRow[] | null>(null)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  // Load available years
  useEffect(() => {
    queryApi<number[]>('sales/years').then(y => {
      setYears(y)
      if (y.length && !y.includes(year)) setYear(y[0])
    }).catch(() => {})
  }, [])

  // Load chart + totals whenever filters change
  const loadData = useCallback(async () => {
    setLoading(true)
    setDrillDay(null)
    setInvoices(null)
    try {
      const params: Record<string, number> = { year }
      if (month > 0) params.month = month
      const [c, t] = await Promise.all([
        queryApi<SalesPeriod[]>('sales/summary', { params }),
        queryApi<SalesTotals>('sales/totals', { params }),
      ])
      setChartData(c)
      setTotals(t)
    } catch {
      setChartData([])
      setTotals(null)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { loadData() }, [loadData])

  // Click a bar → drill down to invoice list for that day
  const handleBarClick = async (data: { activePayload?: { payload: SalesPeriod }[] } | null) => {
    if (!data?.activePayload?.[0]) return
    const period: SalesPeriod = data.activePayload[0].payload
    if (month === 0) {
      // Year view: clicking a month switches to month view
      setMonth(period.period)
      return
    }
    // Month view: clicking a day loads invoices
    const day = period.period
    if (drillDay === day) { setDrillDay(null); setInvoices(null); return }
    setDrillDay(day)
    setLoadingInvoices(true)
    setInvoices(null)
    try {
      const rows = await queryApi<SalesInvoiceRow[]>('sales/invoices', {
        params: { year, month, day }
      })
      setInvoices(rows)
    } catch {
      setInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }

  const togglePaid = async (workId: string) => {
    if (togglingIds.has(workId)) return
    // Optimistic update
    setInvoices(prev => prev?.map(inv =>
      inv.workId === workId ? { ...inv, isPaid: !inv.isPaid } : inv
    ) ?? null)
    setTogglingIds(prev => new Set(prev).add(workId))
    try {
      const result = await patchApi<{ isPaid: boolean }>(
        `sales/invoices/${workId}/togglepaid`
      )
      // Confirm with server value
      setInvoices(prev => prev?.map(inv =>
        inv.workId === workId ? { ...inv, isPaid: result.isPaid } : inv
      ) ?? null)
    } catch {
      // Revert on error
      setInvoices(prev => prev?.map(inv =>
        inv.workId === workId ? { ...inv, isPaid: !inv.isPaid } : inv
      ) ?? null)
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(workId); return s })
    }
  }

  const periodLabel = month > 0 ? MONTHS[month - 1] + ' ' + year : String(year)

  return (
    <main className="lg:pl-62 pb-8">
      <div className="px-4 sm:py-10 sm:px-6 lg:px-8 lg:py-6 space-y-6">

        {/* ── Header + filters ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Tracker</h1>
            <p className="text-sm text-gray-500 mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Year */}
            <select
              value={year}
              onChange={e => { setYear(+e.target.value); setMonth(now.getMonth() + 1) }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {/* Month */}
            <select
              value={month}
              onChange={e => setMonth(+e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>All months</option>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            {month > 0 && (
              <button
                onClick={() => setMonth(0)}
                className="text-sm text-indigo-600 hover:text-indigo-800 underline"
              >
                ← Year view
              </button>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        {totals && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Billed" value={fmt(totals.totalBilled)} color="text-gray-900" />
            <StatCard label="Paid" value={fmt(totals.totalPaid)} color="text-indigo-600" />
            <StatCard label="Outstanding" value={fmt(totals.totalOutstanding)} color="text-amber-500" />
            <StatCard label="Invoices" value={String(totals.invoiceCount)} color="text-gray-700" />
          </div>
        )}

        {/* ── Chart ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No data for this period.</div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">
                {month > 0 ? 'Click a day to see invoices' : 'Click a month to drill down'}
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => 'RM ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="totalPaid" name="Paid" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.period === drillDay ? '#4f46e5' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="totalOutstanding" name="Outstanding" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.period === drillDay ? '#d97706' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* ── Drill-down invoice list ── */}
        {month > 0 && drillDay !== null && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                Invoices — {MONTHS[month - 1]} {drillDay}, {year}
              </h2>
              <button
                onClick={() => { setDrillDay(null); setInvoices(null) }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕ close
              </button>
            </div>
            {loadingInvoices ? (
              <div className="px-6 py-8 text-sm text-gray-400">Loading invoices…</div>
            ) : invoices && invoices.length === 0 ? (
              <div className="px-6 py-8 text-sm text-gray-400">No invoices found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices?.map(inv => (
                    <tr key={inv.workId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{inv.customerName || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{inv.vehicleLine || '—'}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">
                        {fmt(inv.total)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => togglePaid(inv.workId)}
                          disabled={togglingIds.has(inv.workId)}
                          title="Click to toggle paid status"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all
                            ${togglingIds.has(inv.workId) ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:opacity-80 active:scale-95'}
                            ${inv.isPaid
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                        >
                          {inv.isPaid ? 'Paid ✓' : 'Unpaid'}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <a
                          href={`/home/work/${inv.workId}`}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
