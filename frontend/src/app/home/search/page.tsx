import { type Metadata } from 'next'
import Link from 'next/link'
import {
    MagnifyingGlassIcon,
    QueueListIcon,
    DocumentTextIcon,
    UsersIcon,
    TruckIcon,
} from '@heroicons/react/24/outline'
import { httpGet } from '@/_lib/server/query-api'
import SearchBox from './_components/SearchBox'

export const metadata: Metadata = { title: 'Search' }

interface SearchResult {
    id: string
    type: 'work' | 'invoice' | 'client' | 'vehicle'
    title: string
    subtitle?: string
    href: string
}

const typeConfig = {
    work:    { icon: QueueListIcon,    label: 'Work',    color: 'text-primary' },
    invoice: { icon: DocumentTextIcon, label: 'Invoice', color: 'text-success' },
    client:  { icon: UsersIcon,        label: 'Client',  color: 'text-warning' },
    vehicle: { icon: TruckIcon,        label: 'Vehicle', color: 'text-accent' },
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
    const { q } = await searchParams
    const results: SearchResult[] = []

    if (q?.trim()) {
        const params = new URLSearchParams({ searchText: q, limit: '8', offset: '0' })

        const [workRes, clientRes, vehicleRes] = await Promise.all([
            httpGet(`work/page?${params}&desc=true`).catch(() => null),
            httpGet(`clients/page?${params}`).catch(() => null),
            httpGet(`vehicles/page?${params}`).catch(() => null),
        ])

        const workData = workRes?.ok ? await workRes.json() : { items: [] }
        const clientData = clientRes?.ok ? await clientRes.json() : { items: [] }
        const vehicleData = vehicleRes?.ok ? await vehicleRes.json() : { items: [] }

        for (const w of (workData.items ?? [])) {
            results.push({
                id: w.id,
                type: w.issuance ? 'invoice' : 'work',
                title: w.issuance ? `Invoice #${w.issuance.invoiceNumber}` : `Work #${w.workNr ?? w.number}`,
                subtitle: [w.clientName, w.regNr].filter(Boolean).join(' · '),
                href: w.issuance ? `/home/invoices/${w.id}` : `/home/work/${w.id}`,
            })
        }
        for (const c of (clientData.items ?? [])) {
            results.push({
                id: c.id,
                type: 'client',
                title: c.name,
                subtitle: [c.phone, c.email].filter(Boolean).join(' · '),
                href: `/home/clients/${c.id}`,
            })
        }
        for (const v of (vehicleData.items ?? [])) {
            results.push({
                id: v.id,
                type: 'vehicle',
                title: [v.producer, v.model].filter(Boolean).join(' ') || v.regNr,
                subtitle: v.regNr,
                href: `/home/vehicles/${v.id}`,
            })
        }
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <SearchBox defaultValue={q ?? ''} />

            {q?.trim() && results.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                    <MagnifyingGlassIcon className="size-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No results for &ldquo;{q}&rdquo;</p>
                </div>
            )}

            {results.length > 0 && (
                <ul className="space-y-1">
                    {results.map(r => {
                        const cfg = typeConfig[r.type]
                        const Icon = cfg.icon
                        return (
                            <li key={`${r.type}-${r.id}`}>
                                <Link
                                    href={r.href}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
                                >
                                    <Icon className={`size-5 shrink-0 ${cfg.color}`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground truncate">{r.title}</span>
                                            <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                {cfg.label}
                                            </span>
                                        </div>
                                        {r.subtitle && (
                                            <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}

            {!q?.trim() && (
                <div className="flex flex-col items-center py-12 text-center">
                    <MagnifyingGlassIcon className="size-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Start typing to search across everything</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">Work orders, invoices, clients, and vehicles</p>
                </div>
            )}
        </main>
    )
}
