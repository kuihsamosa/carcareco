import {
    QueueListIcon, UsersIcon, TruckIcon, CubeIcon,
    WrenchScrewdriverIcon, DocumentTextIcon, ChartBarIcon, Cog6ToothIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import { httpGet } from '@/_lib/server/query-api'

function StatusChip({ label, value, color, href }: { label: string; value: number | string; color: string; href: string }) {
    return (
        <Link href={href} className={`flex-1 rounded-xl px-3 py-2.5 text-center ${color} active:opacity-80 transition-opacity`}>
            <p className="text-xl font-bold leading-none">{value}</p>
            <p className="text-[10px] font-medium mt-0.5 opacity-80">{label}</p>
        </Link>
    )
}


function QuickLink({ href, icon, label, accent }: { href: string; icon: React.ReactNode; label: string; accent?: string }) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors text-center ${accent ?? 'bg-gray-50 hover:bg-gray-100'}`}
        >
            <span className="text-slate-700">{icon}</span>
            <span className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</span>
        </Link>
    )
}

interface WorkStats {
    inProgress: number;
    waiting: number;
    done: number;
    invoiced: number;
}

export default async function Page() {
    let stats: WorkStats = { inProgress: 0, waiting: 0, done: 0, invoiced: 0 };
    try {
        const res = await httpGet('work/stats');
        if (res.ok) stats = await res.json();
    } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'digest' in e &&
            typeof (e as { digest: unknown }).digest === 'string' &&
            (e as { digest: string }).digest.startsWith('NEXT_REDIRECT')) {
            throw e;
        }
    }

    return (
        <main className="lg:pl-62 p-4 sm:p-8">
            <div className="mb-5">
                <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-400 mt-0.5">Today&apos;s overview</p>
            </div>

            {/* Live Status Strip — tappable chips that filter the work list */}
            <div className="flex gap-2 mb-5 bg-slate-900 rounded-2xl p-3">
                <StatusChip label="🔧 Active" value={stats.inProgress} color="bg-white/10 text-white" href="/home/work?status=inprogress" />
                <StatusChip label="⏳ Open" value={stats.waiting} color="bg-amber-400/20 text-amber-200" href="/home/work" />
                <StatusChip label="✅ Done" value={stats.done} color="bg-green-400/20 text-green-200" href="/home/work?status=closed" />
                <StatusChip label="📬 Invoiced" value={stats.invoiced} color="bg-blue-400/20 text-blue-200" href="/home/work?issued=on" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

                {/* Quick links — 8-icon grid, spans full width */}
                <div className="col-span-2 lg:col-span-3 rounded-2xl bg-white border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick actions</p>
                    <div className="grid grid-cols-4 gap-2">
                        <QuickLink href="/home/work/new"       icon={<WrenchScrewdriverIcon className="w-6 h-6" />} label="New Job"  accent="bg-slate-900 [&_span]:text-white [&_.text-gray-700]:text-white hover:bg-slate-800" />
                        <QuickLink href="/home/clients"        icon={<UsersIcon className="w-6 h-6" />}             label="Clients" />
                        <QuickLink href="/home/vehicles"       icon={<TruckIcon className="w-6 h-6" />}             label="Vehicles" />
                        <QuickLink href="/home/inventory"      icon={<CubeIcon className="w-6 h-6" />}              label="Stock" />
                        <QuickLink href="/home/work"           icon={<QueueListIcon className="w-6 h-6" />}         label="Work list" />
                        <QuickLink href="/home/work?issued=on" icon={<DocumentTextIcon className="w-6 h-6" />}      label="Invoices" />
                        <QuickLink href="/home/sales"          icon={<ChartBarIcon className="w-6 h-6" />}          label="Sales" />
                        <QuickLink href="/home/settings"       icon={<Cog6ToothIcon className="w-6 h-6" />}         label="Settings" />
                    </div>
                </div>

            </div>
        </main>
    )
}
