import { type Metadata } from 'next'
import {
    QueueListIcon, UsersIcon, TruckIcon, CubeIcon,
    WrenchScrewdriverIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import moment from "moment"
import { httpGet } from '@/_lib/server/query-api'

export const metadata: Metadata = { title: 'Dashboard' }

interface WorkStats {
    inProgress: number;
    waiting: number;
    done: number;
    invoiced: number;
}

interface RecentWork {
    id: string;
    workNr?: string;
    number?: string;
    status?: string;
    startedOn?: string;
    clientName?: string;
    vehicleRegNr?: string;
    vehicleProducer?: string;
    vehicleModel?: string;
}

const STAT_THEME = {
    indigo:  { tint: 'bg-primary/10', ring: 'ring-primary/20', dot: 'bg-primary', value: 'text-primary' },
    amber:   { tint: 'bg-warning/10', ring: 'ring-warning/20', dot: 'bg-warning', value: 'text-warning' },
    green:   { tint: 'bg-success/10', ring: 'ring-success/20', dot: 'bg-success', value: 'text-success' },
    blue:    { tint: 'bg-accent/10',  ring: 'ring-accent/20',  dot: 'bg-accent',  value: 'text-accent' },
} as const

function StatTile({ label, value, theme, href }: {
    label: string; value: number; theme: keyof typeof STAT_THEME; href: string
}) {
    const t = STAT_THEME[theme]
    return (
        <Link
            href={href}
            className={`group relative flex min-h-[88px] flex-col justify-between rounded-2xl p-4 ring-1 ${t.tint} ${t.ring} transition-transform active:scale-[0.98]`}
        >
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className={`text-3xl font-bold leading-none tabular-nums ${t.value}`}>{value}</span>
                <ArrowRightIcon className="size-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
            </div>
        </Link>
    )
}

function QuickLink({ href, icon, label, primary }: {
    href: string; icon: React.ReactNode; label: string; primary?: boolean
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-colors ${
                primary
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
        >
            <span>{icon}</span>
            <span className="text-[11px] font-semibold leading-tight">{label}</span>
        </Link>
    )
}

function StatusPill({ status }: { status?: string }) {
    const s = (status ?? '').toLowerCase()
    const map: Record<string, string> = {
        completed: 'bg-accent/10 text-accent',
        inprogress: 'bg-success/10 text-success',
        closed: 'bg-warning/10 text-warning',
    }
    const label: Record<string, string> = {
        completed: 'Completed', inprogress: 'In Progress', closed: 'Closed',
    }
    return (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[s] ?? 'bg-warning/10 text-warning'}`}>
            {label[s] ?? 'Open'}
        </span>
    )
}

export default async function Page() {
    let stats: WorkStats = { inProgress: 0, waiting: 0, done: 0, invoiced: 0 };
    let recent: RecentWork[] = [];

    const rethrowRedirect = (e: unknown) => {
        if (typeof e === 'object' && e !== null && 'digest' in e &&
            typeof (e as { digest: unknown }).digest === 'string' &&
            (e as { digest: string }).digest.startsWith('NEXT_REDIRECT')) {
            throw e;
        }
    };

    try {
        const res = await httpGet('work/stats');
        if (res.ok) stats = await res.json();
    } catch (e: unknown) { rethrowRedirect(e); }

    try {
        const res = await httpGet('work/page?limit=5&offset=0&desc=true');
        if (res.ok) {
            const data = await res.json();
            recent = (data.items ?? []) as RecentWork[];
        }
    } catch (e: unknown) { rethrowRedirect(e); }

    const totalOpen = stats.inProgress + stats.waiting;

    return (
        <main className="min-h-dvh">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">

                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Dashboard</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {moment().format('dddd, D MMMM YYYY')}
                        </p>
                    </div>
                    <Link
                        href="/home/work/new"
                        className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:inline-flex"
                    >
                        <WrenchScrewdriverIcon className="size-4" />
                        New Job
                    </Link>
                </div>

                <section className="mb-6">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatTile label="Active"   value={stats.inProgress} theme="indigo" href="/home/work?status=inprogress" />
                        <StatTile label="Open"      value={stats.waiting}    theme="amber"  href="/home/work?status=waiting" />
                        <StatTile label="Done"      value={stats.done}       theme="green"  href="/home/work?status=closed" />
                        <StatTile label="Invoiced"  value={stats.invoiced}   theme="blue"   href="/home/invoices" />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                    <section className="lg:col-span-2">
                        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground">Recent work</h2>
                                <Link href="/home/work" className="text-xs font-medium text-primary hover:text-primary/80">
                                    View all
                                </Link>
                            </div>

                            {recent.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <QueueListIcon className="size-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">
                                        {totalOpen > 0 ? 'No recent work to show.' : 'No work orders yet.'}
                                    </p>
                                    <Link href="/home/work/new" className="text-sm font-medium text-primary hover:text-primary/80">
                                        Create the first one →
                                    </Link>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {recent.map((w) => (
                                        <li key={w.id}>
                                            <Link
                                                href={`/home/work/${w.id}`}
                                                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-secondary"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            Work {w.workNr ?? w.number}
                                                        </span>
                                                        <StatusPill status={w.status} />
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                        {w.vehicleRegNr && (
                                                            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                {w.vehicleRegNr}
                                                            </span>
                                                        )}
                                                        <span className="truncate">
                                                            {[w.vehicleProducer, w.vehicleModel].filter(Boolean).join(' ') || w.clientName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-xs text-muted-foreground" title={w.startedOn ? moment(w.startedOn).format('LL') : ''}>
                                                    {w.startedOn ? moment(w.startedOn).fromNow() : ''}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    <section className="lg:col-span-1">
                        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</p>
                            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
                                <QuickLink href="/home/work/new"       icon={<WrenchScrewdriverIcon className="size-6" />} label="New Job" primary />
                                <QuickLink href="/home/clients"        icon={<UsersIcon className="size-6" />}             label="Clients" />
                                <QuickLink href="/home/vehicles"       icon={<TruckIcon className="size-6" />}             label="Vehicles" />
                                <QuickLink href="/home/inventory"      icon={<CubeIcon className="size-6" />}              label="Stock" />
                                <QuickLink href="/home/work"           icon={<QueueListIcon className="size-6" />}         label="Work list" />
                                <QuickLink href="/home/invoices" icon={<DocumentTextIcon className="size-6" />}      label="Invoices" />
                                <QuickLink href="/home/sales"          icon={<ChartBarIcon className="size-6" />}          label="Sales" />
                                <QuickLink href="/home/settings"       icon={<Cog6ToothIcon className="size-6" />}         label="Settings" />
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    )
}
