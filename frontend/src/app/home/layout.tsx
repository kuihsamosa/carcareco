'use server'

import { cookies } from 'next/headers'
import IconRail from './_components/layout/IconRail'
import MobileNav from './_components/layout/MobileNav'
import CommandPalette from './_components/layout/CommandPalette'
import OfflineIndicator from './_components/layout/OfflineIndicator'
import ToastMessages from '@/_components/ToastMessages'
import { redirect } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'

interface CustomJwtPayload {
    FullName?: string
}

export default async function Layout({ children }: { children: React.ReactNode }) {
    const jwt = (await cookies()).get('jwt')?.value

    if (!jwt) {
        redirect('/home/logout')
    }

    const decodedToken = jwtDecode<CustomJwtPayload>(jwt)
    const fullName = decodedToken.FullName || ''

    if (!fullName) {
        redirect('/home/logout')
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/users/profilepicture/${jwt}`

    return (
        <>
            <ToastMessages />
            <OfflineIndicator />
            <CommandPalette />
            <IconRail fullName={fullName} imageUrl={imageUrl} />
            <MobileNav fullName={fullName} imageUrl={imageUrl} />
            <div className="pb-20 lg:pb-0 lg:pl-16">
                {children}
            </div>
        </>
    )
}
