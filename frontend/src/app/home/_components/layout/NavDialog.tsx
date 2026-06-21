'use client'
import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from "@headlessui/react";
import {
    XMarkIcon, QueueListIcon, UsersIcon, TruckIcon,
    DocumentTextIcon, PlusIcon, Bars3Icon,
} from "@heroicons/react/24/outline";
import Nav from './Nav';
import ProfileMenu from './ProfileMenu';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

const bottomTabs = [
    {
        name: 'Work', href: '/home/work', icon: QueueListIcon,
        activeMatch: (p: string, s: string) => p.startsWith('/home/work') && !s.includes('issued=on'),
    },
    {
        name: 'Invoices', href: '/home/work?issued=on', icon: DocumentTextIcon,
        activeMatch: (p: string, s: string) => p.startsWith('/home/work') && s.includes('issued=on'),
    },
    {
        name: 'Clients', href: '/home/clients', icon: UsersIcon,
        activeMatch: (p: string, _s: string) => p.startsWith('/home/clients'),
    },
    {
        name: 'Vehicles', href: '/home/vehicles', icon: TruckIcon,
        activeMatch: (p: string, _s: string) => p.startsWith('/home/vehicles'),
    },
];

export default function NavDialog({
    fullName,
    imageUrl,
    lowStockCount = 0,
}: {
    fullName: string;
    imageUrl: string;
    lowStockCount?: number;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();

    function isActive(tab: { href: string; activeMatch?: (p: string, s: string) => boolean }) {
        if (tab.activeMatch) return tab.activeMatch(pathname ?? '', search);
        return pathname?.startsWith(tab.href);
    }

    return (
        <>
            {/* Slide-over for "More" items */}
            <Dialog open={sidebarOpen} onClose={() => setSidebarOpen(false)} className="relative z-50 lg:hidden">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
                />
                <div className="fixed inset-0 flex">
                    <DialogPanel
                        transition
                        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                    >
                        <TransitionChild>
                            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                    <span className="sr-only">Close sidebar</span>
                                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                                </button>
                            </div>
                        </TransitionChild>
                        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-2 ring-1 ring-white/10">
                            <Nav fullName={fullName} imageUrl={imageUrl} onSmallScreen={true} lowStockCount={lowStockCount} />
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Mobile top bar — slim, just branding + profile */}
            <div className="sticky top-0 z-40 flex items-center justify-between bg-gray-900 px-4 py-3 shadow-xs lg:hidden">
                <span className="text-white font-semibold text-sm tracking-wide">CarCare</span>
                <ProfileMenu fullName={fullName} imageUrl={imageUrl} onSmallScreen={true} />
            </div>

            {/* Mobile bottom tab bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-stretch h-16">
                    {/* Left two tabs */}
                    {bottomTabs.slice(0, 2).map((tab) => {
                        const active = isActive(tab);
                        const Icon = tab.icon;
                        return (
                            <a
                                key={tab.name}
                                href={tab.href}
                                className={clsx(
                                    'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                                    active ? 'text-slate-900' : 'text-gray-400',
                                )}
                            >
                                <Icon className="size-5" aria-hidden="true" />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </a>
                        );
                    })}

                    {/* Center FAB — New Job */}
                    <Link
                        href="/home/work/new"
                        className="flex flex-col items-center justify-end pb-1 px-3 flex-shrink-0"
                    >
                        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 shadow-lg -translate-y-3">
                            <PlusIcon className="size-6 text-white" aria-hidden="true" />
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 -mt-1.5">New Job</span>
                    </Link>

                    {/* Right two tabs */}
                    {bottomTabs.slice(2).map((tab) => {
                        const active = isActive(tab);
                        const Icon = tab.icon;
                        return (
                            <a
                                key={tab.name}
                                href={tab.href}
                                className={clsx(
                                    'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                                    active ? 'text-slate-900' : 'text-gray-400',
                                )}
                            >
                                <Icon className="size-5" aria-hidden="true" />
                                <span className="text-[10px] font-medium">{tab.name}</span>
                            </a>
                        );
                    })}

                    {/* More — opens slide-over */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-gray-400"
                    >
                        <Bars3Icon className="size-5" aria-hidden="true" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
