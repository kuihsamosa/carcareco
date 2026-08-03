import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Image from 'next/image'

const userNavigation = [
    { name: 'My profile', href: '/home/profile' },
    { name: 'Sign out', href: '/home/logout' },
]

export default function ProfileMenu({
    onSmallScreen,
    fullName,
    imageUrl,
    compact = false,
}: {
    onSmallScreen: boolean
    fullName: string
    imageUrl: string
    compact?: boolean
}) {
    return (
        <Menu as="div" className="relative">
            <MenuButton className={clsx(onSmallScreen && '-m-1.5', 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors')}>
                <span className="sr-only">Open user menu</span>
                <Image alt={fullName} src={imageUrl} width={100} height={100} className="size-7 rounded-full bg-muted shrink-0" />
                {!compact && !onSmallScreen && (
                    <span className="hidden lg:flex lg:items-center">
                        <span aria-hidden="true" className="text-sm font-medium text-foreground truncate max-w-[100px]">{fullName}</span>
                        <EllipsisVerticalIcon aria-hidden="true" className="ml-1 size-4 text-muted-foreground" />
                    </span>
                )}
            </MenuButton>
            <MenuItems
                modal={false}
                transition
                className={clsx(
                    !onSmallScreen && 'bottom-full mb-1',
                    'absolute right-0 z-10 w-36 origin-top-right rounded-lg bg-popover text-popover-foreground border border-border py-1 shadow-lg transition focus:outline-hidden data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in',
                )}
            >
                {userNavigation.map(item => (
                    <MenuItem key={item.name}>
                        <a href={item.href} className="block px-3 py-1.5 text-sm hover:bg-secondary transition-colors">
                            {item.name}
                        </a>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    )
}
