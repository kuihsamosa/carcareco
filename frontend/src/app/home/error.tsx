'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center px-4">
                <ExclamationTriangleIcon className="mx-auto size-12 text-warning" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h2>
                <p className="mt-2 text-sm text-muted-foreground">An unexpected error occurred. Please try again.</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Try again
                    </button>
                    <a href="/home" className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors">
                        Dashboard
                    </a>
                </div>
            </div>
        </main>
    )
}
