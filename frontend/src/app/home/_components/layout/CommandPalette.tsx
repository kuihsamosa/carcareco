'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from '@/components/ui/command'
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
    PlusCircleIcon,
    SunIcon,
    MoonIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '@/components/ThemeProvider'

export default function CommandPalette() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { theme, toggle } = useTheme()

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen(o => !o)
            }
        }
        function onToggle() {
            setOpen(o => !o)
        }
        document.addEventListener('keydown', onKeyDown)
        document.addEventListener('toggle-command-palette', onToggle)
        return () => {
            document.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('toggle-command-palette', onToggle)
        }
    }, [])

    const go = useCallback((href: string) => {
        setOpen(false)
        router.push(href)
    }, [router])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search…" />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => go('/home')}>
                        <HomeIcon className="size-4 mr-2" /> Dashboard
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/work')}>
                        <QueueListIcon className="size-4 mr-2" /> Work orders
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/invoices')}>
                        <DocumentTextIcon className="size-4 mr-2" /> Invoices
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/clients')}>
                        <UsersIcon className="size-4 mr-2" /> Clients
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/vehicles')}>
                        <TruckIcon className="size-4 mr-2" /> Vehicles
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/services')}>
                        <WrenchScrewdriverIcon className="size-4 mr-2" /> Services
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/inventory')}>
                        <CubeIcon className="size-4 mr-2" /> Spare parts
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/sales')}>
                        <ChartBarIcon className="size-4 mr-2" /> Sales
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/settings')}>
                        <Cog6ToothIcon className="size-4 mr-2" /> Settings
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/help')}>
                        <QuestionMarkCircleIcon className="size-4 mr-2" /> Help
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => go('/home/invoices/new')}>
                        <PlusCircleIcon className="size-4 mr-2" /> New invoice
                    </CommandItem>
                    <CommandItem onSelect={() => go('/home/work/new')}>
                        <PlusCircleIcon className="size-4 mr-2" /> New work order
                    </CommandItem>
                    <CommandItem onSelect={() => { toggle(); setOpen(false) }}>
                        {theme === 'dark'
                            ? <><SunIcon className="size-4 mr-2" /> Switch to light theme</>
                            : <><MoonIcon className="size-4 mr-2" /> Switch to dark theme</>
                        }
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
