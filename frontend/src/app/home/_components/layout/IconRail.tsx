'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
    HomeIcon,
    QueueListIcon,
    DocumentTextIcon,
    UsersIcon,
    TruckIcon,
    WrenchScrewdriverIcon,
    CubeIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import ProfileMenu from './ProfileMenu'
import { useTheme } from '@/components/ThemeProvider'

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    match: (p: string) => boolean
    badge?: number
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/home', icon: HomeIcon, match: p => p === '/home' },
    { name: 'Work', href: '/home/work', icon: QueueListIcon, match: p => p.startsWith('/home/work') },
    { name: 'Invoices', href: '/home/invoices', icon: DocumentTextIcon, match: p => p.startsWith('/home/invoices') },
    { name: 'Clients', href: '/home/clients', icon: UsersIcon, match: p => p.startsWith('/home/clients') },
    { name: 'Vehicles', href: '/home/vehicles', icon: TruckIcon, match: p => p.startsWith('/home/vehicles') },
    { name: 'Services', href: '/home/services', icon: WrenchScrewdriverIcon, match: p => p.startsWith('/home/services') },
    { name: 'Spare parts', href: '/home/inventory', icon: CubeIcon, match: p => p.startsWith('/home/inventory') },
    { name: 'Sales', href: '/home/sales', icon: ChartBarIcon, match: p => p.startsWith('/home/sales') },
]

export default function IconRail({ fullName, imageUrl }: { fullName: string; imageUrl: string }) {
    const pathname = usePathname()
    const [expanded, setExpanded] = useState(false)
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const { theme, toggle } = useTheme()

    const [lowStockCount, setLowStockCount] = useState(0)
    useEffect(() => {
        const jwt = document.cookie.split('; ').find(c => c.startsWith('jwt='))?.split('=')[1]
        if (!jwt) return
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 8000)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spareparts/lowstock/count`, {
            headers: { Authorization: `Bearer ${jwt}` },
            signal: ctrl.signal,
        })
            .then(r => r.ok ? r.json() : 0)
            .then(n => setLowStockCount(Number(n) || 0))
            .catch(() => {})
            .finally(() => clearTimeout(t))
        return () => clearTimeout(t)
    }, [])

    const items = navItems.map(item =>
        item.name === 'Spare parts' && lowStockCount > 0
            ? { ...item, badge: lowStockCount }
            : item
    )

    return (
        <aside
            className={clsx(
                'fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r border-border transition-all duration-200 ease-out',
                expanded ? 'w-52' : 'w-16',
            )}
            style={{ backdropFilter: 'blur(16px)', background: 'var(--sidebar)' }}
            onMouseEnter={() => { hoverTimer.current = setTimeout(() => setExpanded(true), 400) }}
            onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setExpanded(false) }}
        >
            {/* Logo */}
            <div className="flex h-14 items-center px-4 shrink-0">
                <Image alt="CarCare" width={28} height={28} src="/logo.png" className="shrink-0" />
                {expanded && <span className="ml-3 text-sm font-semibold text-foreground whitespace-nowrap">CarCare</span>}
            </div>

            {/* Search trigger */}
            <button
                type="button"
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className={clsx(
                    'mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors',
                )}
                aria-label="Search (⌘K)"
            >
                <MagnifyingGlassIcon className="size-5 shrink-0" />
                {expanded && <span className="text-sm whitespace-nowrap">Search <kbd className="ml-auto text-xs text-muted-foreground">⌘K</kbd></span>}
            </button>

            {/* Nav items */}
            <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
                {items.map(item => {
                    const active = item.match(pathname ?? '')
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                            )}
                            aria-label={item.name}
                            title={expanded ? undefined : item.name}
                        >
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-primary" />
                            )}
                            <span className="relative shrink-0">
                                <Icon className="size-5" />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold">
                                        {item.badge}
                                    </span>
                                )}
                            </span>
                            {expanded && <span className="whitespace-nowrap">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom: Help, Settings, Profile */}
            <div className="mt-auto px-2 pb-3 flex flex-col gap-0.5">
                <Link
                    href="/home/help"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="Help"
                    title={expanded ? undefined : 'Help'}
                >
                    <QuestionMarkCircleIcon className="size-5 shrink-0" />
                    {expanded && <span className="whitespace-nowrap">Help</span>}
                </Link>
                <Link
                    href="/home/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="Settings"
                    title={expanded ? undefined : 'Settings'}
                >
                    <Cog6ToothIcon className="size-5 shrink-0" />
                    {expanded && <span className="whitespace-nowrap">Settings</span>}
                </Link>
                <ProfileMenu fullName={fullName} imageUrl={imageUrl} onSmallScreen={false} compact={!expanded} />
            </div>
        </aside>
    )
}
