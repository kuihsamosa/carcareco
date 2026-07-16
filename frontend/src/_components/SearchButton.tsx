'use client'

import { useState, useEffect } from 'react'
import PrimaryButton from './PrimaryButton'

export default function SearchButton({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(false)
    }, [])

    return (
        <PrimaryButton id={id} loading={loading} className={className} onClick={() => setLoading(true)}>
            {children}
        </PrimaryButton>
    )
}
