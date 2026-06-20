'use client'
import Image from "next/image"
import ProfileMenu from "./ProfileMenu"
import {
    Cog6ToothIcon,
    QueueListIcon,
    TruckIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentTextIcon,
    WrenchScrewdriverIcon,
  } from '@heroicons/react/24/outline'
import clsx from "clsx";
import { usePathname, useSearchParams } from 'next/navigation'
 const navigationIconClass = "size-6 shrink-0";
const navigation = [
    // { name: 'Dashboard', href: '/home', icon: <HomeIcon aria-hidden="true" className={navigationIconClass}></HomeIcon>},
    { name: 'Work', href: '/home/work', icon: <QueueListIcon aria-hidden="true" className={navigationIconClass}></QueueListIcon>, activeMatch: (path: string, search: string) => path.startsWith('/home/work') && !search.includes('issued=on') },
    { name: 'Invoices', href: '/home/work?issued=on', icon: <DocumentTextIcon aria-hidden="true" className={navigationIconClass}></DocumentTextIcon>, activeMatch: (path: string, search: string) => path.startsWith('/home/work') && search.includes('issued=on') },
    { name: 'Clients', href: '/home/clients', icon: <UsersIcon aria-hidden="true" className={navigationIconClass}></UsersIcon>  },
    { name: 'Vehicles', href: '/home/vehicles', icon: <TruckIcon aria-hidden="true" className={navigationIconClass}></TruckIcon>  },
    { name: 'Inventory', href: '/home/inventory', icon: <Cog6ToothIcon aria-hidden="true" className={navigationIconClass}></Cog6ToothIcon>  },
    { name: 'Sales', href: '/home/sales', icon: <ChartBarIcon aria-hidden="true" className={navigationIconClass}></ChartBarIcon>  },
    { name: 'Services', href: '/home/services', icon: <WrenchScrewdriverIcon aria-hidden="true" className={navigationIconClass}></WrenchScrewdriverIcon>  },
]
 

export default   function Nav({
    onSmallScreen, 
    fullName,
    imageUrl,
}:{
    onSmallScreen:boolean, 
    fullName:string,
    imageUrl:string
}) {
    const currentPath = usePathname();
    const searchParams = useSearchParams();
    const currentSearch = searchParams.toString();

    function isActive(item: typeof navigation[0]) {
        if ('activeMatch' in item && item.activeMatch) return item.activeMatch(currentPath ?? '', currentSearch);
        return item.href !== '/home' ? currentPath?.startsWith(item.href) : currentPath === '/home';
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
                                    <a
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
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </li>
                    {!onSmallScreen && <li className="mt-auto flex flex-col mb-5   ">
                        <a
                            href="/home/settings"
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <Cog6ToothIcon aria-hidden="true" className="size-6 shrink-0" />
                            Settings
                        </a>
                        <ProfileMenu  fullName={fullName} imageUrl={imageUrl} onSmallScreen={false}></ProfileMenu>
                    </li>}
                </ul>
            </nav>

        </>
    )
}