'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import ProfileMenu from "./ProfileMenu"
import {
    Cog6ToothIcon,
    QueueListIcon,
    TruckIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentTextIcon,
    CubeIcon,
    HomeIcon,
    PlusCircleIcon,
  } from '@heroicons/react/24/outline'
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation'

const navigationIconClass = "size-6 shrink-0";

const baseNavigation = [
    { name: 'Dashboard', href: '/home', icon: <HomeIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path === '/home' },
    { name: 'Work', href: '/home/work', icon: <QueueListIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path.startsWith('/home/work') },
    { name: 'Invoices', href: '/home/invoices', icon: <DocumentTextIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path.startsWith('/home/invoices') && path !== '/home/invoices/new' },
    { name: 'New invoice', href: '/home/invoices/new', icon: <PlusCircleIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path === '/home/invoices/new' },
    { name: 'Clients', href: '/home/clients', icon: <UsersIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path.startsWith('/home/clients') },
    { name: 'Vehicles', href: '/home/vehicles', icon: <TruckIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path.startsWith('/home/vehicles') },
    { name: 'Sales', href: '/home/sales', icon: <ChartBarIcon aria-hidden="true" className={navigationIconClass} />, activeMatch: (path: string) => path.startsWith('/home/sales') },
];

export default function Nav({
    onSmallScreen,
    fullName,
    imageUrl,
}: {
    onSmallScreen: boolean;
    fullName: string;
    imageUrl: string;
}) {
    const currentPath = usePathname();
    const searchParams = useSearchParams();
    const currentSearch = searchParams.toString();

    // Fetched in the browser (not during SSR) so a slow/hung backend can never
    // block rendering. Failure is silent — the badge simply stays hidden.
    const [lowStockCount, setLowStockCount] = useState(0);
    useEffect(() => {
        const jwt = document.cookie.split('; ').find((c) => c.startsWith('jwt='))?.split('=')[1];
        if (!jwt) return;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spareparts/lowstock/count`, {
            headers: { Authorization: `Bearer ${jwt}` },
            signal: controller.signal,
        })
            .then((r) => (r.ok ? r.json() : 0))
            .then((n) => setLowStockCount(Number(n) || 0))
            .catch(() => { /* non-fatal — badge stays hidden */ })
            .finally(() => clearTimeout(timer));
        return () => clearTimeout(timer);
    }, []);

    // Inventory is injected before Sales (the last baseNavigation entry) so the
    // low-stock badge can depend on client-side state. Index derived rather than
    // hard-coded — adding a nav item must not silently reorder the menu.
    const inventoryAt = baseNavigation.length - 1;
    const navigation = [
        ...baseNavigation.slice(0, inventoryAt),
        {
            name: 'Inventory', href: '/home/inventory',
            activeMatch: (path: string) => path.startsWith('/home/inventory'),
            icon: (
                <span className="relative">
                    <CubeIcon aria-hidden="true" className={navigationIconClass} />
                    {lowStockCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                            {lowStockCount}
                        </span>
                    )}
                </span>
            ),
        },
        ...baseNavigation.slice(inventoryAt),
    ];

    function isActive(item: typeof navigation[0]) {
        if (item.activeMatch) return (item.activeMatch as (p: string, s: string) => boolean)(currentPath ?? '', currentSearch);
        return currentPath?.startsWith(item.href);
    }

    return (
        <>
            <div className="flex h-16 shrink-0 items-center">
                <Image alt="B-dec" width="50" height="50" className="h-8 w-auto" src="/logo.png" ></Image>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={clsx(
                                               isActive(item)
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                        )}
                                    >
                                        {item.icon}
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li className="mt-auto flex flex-col mb-5   ">
                        <Link
                            href="/home/settings"
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <Cog6ToothIcon aria-hidden="true" className="size-6 shrink-0" />
                            Settings
                        </Link>
                        <ProfileMenu  fullName={fullName} imageUrl={imageUrl} onSmallScreen={onSmallScreen}></ProfileMenu>
                    </li>
                </ul>
            </nav>

        </>
    )
}