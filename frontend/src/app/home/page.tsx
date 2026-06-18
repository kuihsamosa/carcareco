import { QueueListIcon, UsersIcon, TruckIcon, CubeIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, CurrencyEuroIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

function StatCard({ label, value, sub, colorClass, icon }: {
    label: string
    value: string | number
    sub?: string
    colorClass?: string
    icon?: React.ReactNode
}) {
    return (
        <div className={`rounded-2xl p-4 flex flex-col justify-between h-full ${colorClass ?? 'bg-white border border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                {icon && <span className="text-gray-300">{icon}</span>}
            </div>
            <div>
                <p className="text-3xl font-medium text-gray-900 leading-none">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
        </div>
    )
}

function QuickLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <span className="text-slate-600">{icon}</span>
            <span className="text-xs font-medium text-gray-600">{label}</span>
        </Link>
    )
}

export default function Page() {
    return (
        <main className="lg:pl-62 p-4 sm:p-8">
            <div className="mb-6">
                <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-400 mt-0.5">Today&apos;s overview</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-[120px]">

                {/* Hero card — active jobs, spans 2 cols */}
                <div className="col-span-2 row-span-1 rounded-2xl bg-slate-800 p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Active jobs</span>
                        <QueueListIcon className="w-5 h-5 text-slate-500" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-4xl font-medium text-white leading-none">12</p>
                        <p className="text-xs text-slate-400 mt-1">3 awaiting parts · 2 ready to collect</p>
                    </div>
                </div>

                {/* Completed today */}
                <div className="col-span-1 row-span-1 rounded-2xl p-4 flex flex-col justify-between" style={{ background: '#EAF3DE' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: '#3B6D11' }}>Completed today</span>
                        <CheckCircleIcon className="w-4 h-4" style={{ color: '#3B6D11', opacity: 0.5 }} aria-hidden="true" />
                    </div>
                    <p className="text-3xl font-medium text-gray-900">4</p>
                </div>

                {/* Revenue due */}
                <div className="col-span-1 row-span-1">
                    <StatCard
                        label="Invoices due"
                        value="€ 1,840"
                        sub="3 outstanding"
                        icon={<CurrencyEuroIcon className="w-5 h-5" />}
                    />
                </div>

                {/* Avg job time */}
                <div className="col-span-1 row-span-1">
                    <StatCard
                        label="Avg. job time"
                        value="2.4 h"
                        sub="This week"
                        icon={<ClockIcon className="w-5 h-5" />}
                    />
                </div>

                {/* Awaiting parts */}
                <div className="col-span-1 row-span-1 rounded-2xl p-4 flex flex-col justify-between" style={{ background: '#FAEEDA' }}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: '#854F0B' }}>Awaiting parts</span>
                        <ExclamationTriangleIcon className="w-4 h-4" style={{ color: '#854F0B', opacity: 0.5 }} aria-hidden="true" />
                    </div>
                    <p className="text-3xl font-medium text-gray-900">3</p>
                </div>

                {/* Quick links — spans full width */}
                <div className="col-span-2 lg:col-span-3 row-span-1 rounded-2xl bg-white border border-gray-100 p-4 flex items-center">
                    <div className="grid grid-cols-4 gap-2 w-full">
                        <QuickLink href="/home/work/new" icon={<QueueListIcon className="w-5 h-5" />} label="New job" />
                        <QuickLink href="/home/clients" icon={<UsersIcon className="w-5 h-5" />} label="Clients" />
                        <QuickLink href="/home/vehicles" icon={<TruckIcon className="w-5 h-5" />} label="Vehicles" />
                        <QuickLink href="/home/inventory" icon={<CubeIcon className="w-5 h-5" />} label="Inventory" />
                    </div>
                </div>

            </div>
        </main>
    )
}
