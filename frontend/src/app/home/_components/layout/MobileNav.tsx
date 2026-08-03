'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
    QueueListIcon,
    DocumentTextIcon,
    UsersIcon,
    TruckIcon,
    PlusIcon,
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    WrenchScrewdriverIcon,
    CubeIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import ProfileMenu from './ProfileMenu'

const bottomTabs = [
    { name: 'Work', href: '/home/work', icon: QueueListIcon, match: (p: string) => p.startsWith('/home/work') },
    { name: 'Invoices', href: '/home/invoices', icon: DocumentTextIcon, match: (p: string) => p.startsWith('/home/invoices') },
    { name: 'Clients', href: '/home/clients', icon: UsersIcon, match: (p: string) => p.startsWith('/home/clients') },
    { name: 'Vehicles', href: '/home/vehicles', icon: TruckIcon, match: (p: string) => p.startsWith('/home/vehicles') },
]

const moreItems = [
    { name: 'Dashboard', href: '/home', icon: HomeIcon },
    { name: 'Services', href: '/home/services', icon: WrenchScrewdriverIcon },
    { name: 'Spare parts', href: '/home/inventory', icon: CubeIcon },
    { name: 'Sales', href: '/home/sales', icon: ChartBarIcon },
    { name: 'Settings', href: '/home/settings', icon: Cog6ToothIcon },
    { name: 'Help', href: '/home/help', icon: QuestionMarkCircleIcon },
]

export default function MobileNav({ fullName, imageUrl }: { fullName: string; imageUrl: string }) {
    const [sheetOpen, setSheetOpen] = useState(false)
    const pathname = usePathname()

    return (
        <>
            {/* Top bar */}
            <div className="sticky top-0 z-40 flex items-center justify-between bg-card border-b border-border px-4 py-3 lg:hidden">
                <span className="text-foreground font-semibold text-sm tracking-wide">CarCare</span>
                <ProfileMenu fullName={fullName} imageUrl={imageUrl} onSmallScreen={true} />
            </div>

            {/* Bottom tab bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-stretch h-16">
                    {bottomTabs.slice(0, 2).map(tab => {
                        const active = tab.match(pathname ?? '')
                        const Icon = tab.icon
                        return (
                            <Link key={tab.name} href={tab.href} className={clsx('flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors min-w-[44px] min-h-[44px]', active ? 'text-primary' : 'text-muted-foreground')}>
                                <Icon className="size-5" aria-hidden="true" />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </Link>
                        )
                    })}

                    <Link href="/home/work/new" className="flex flex-col items-center justify-end pb-1 px-3 shrink-0">
                        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg -translate-y-3">
                            <PlusIcon className="size-6 text-primary-foreground" aria-hidden="true" />
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground -mt-1.5">New Job</span>
                    </Link>

                    {bottomTabs.slice(2).map(tab => {
                        const active = tab.match(pathname ?? '')
                        const Icon = tab.icon
                        return (
                            <Link key={tab.name} href={tab.href} className={clsx('flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors min-w-[44px] min-h-[44px]', active ? 'text-primary' : 'text-muted-foreground')}>
                                <Icon className="size-5" aria-hidden="true" />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </Link>
                        )
                    })}

                    <button type="button" onClick={() => setSheetOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground min-w-[44px] min-h-[44px]">
                        <Bars3Icon className="size-5" aria-hidden="true" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>

            {/* More sheet */}
            <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} className="relative z-50 lg:hidden">
                <DialogBackdrop transition className="fixed inset-0 bg-black/60 transition-opacity duration-300 data-closed:opacity-0" />
                <div className="fixed inset-0 flex">
                    <DialogPanel transition className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full">
                        <TransitionChild>
                            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 data-closed:opacity-0">
                                <button type="button" onClick={() => setSheetOpen(false)} className="-m-2.5 p-2.5">
                                    <span className="sr-only">Close sidebar</span>
                                    <XMarkIcon className="size-6 text-white" aria-hidden="true" />
                                </button>
                            </div>
                        </TransitionChild>
                        <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-card px-6 py-6">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
                            <nav className="flex flex-col gap-1">
                                {moreItems.map(item => {
                                    const Icon = item.icon
                                    return (
                                        <Link key={item.name} href={item.href} onClick={() => setSheetOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                                            <Icon className="size-5 text-muted-foreground" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    )
}
