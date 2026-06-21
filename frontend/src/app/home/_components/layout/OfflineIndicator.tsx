'use client'
import { useEffect, useState } from 'react'
import { WifiIcon } from '@heroicons/react/24/outline'

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        setIsOnline(navigator.onLine)
        const up = () => setIsOnline(true)
        const down = () => setIsOnline(false)
        window.addEventListener('online', up)
        window.addEventListener('offline', down)
        return () => {
            window.removeEventListener('online', up)
            window.removeEventListener('offline', down)
        }
    }, [])

    if (isOnline) return null

    return (
        <div className="fixed top-14 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 text-white text-xs py-2 font-medium lg:hidden">
            <WifiIcon className="size-4 opacity-80" />
            No internet connection — changes may not save
        </div>
    )
}
