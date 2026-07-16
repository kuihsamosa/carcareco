'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <main className="min-h-[60vh] flex items-center justify-center lg:pl-62">
            <div className="text-center px-4">
                <ExclamationTriangleIcon className="mx-auto size-12 text-amber-400" />
                <h2 className="mt-4 text-lg font-semibold text-gray-900">Something went wrong</h2>
                <p className="mt-2 text-sm text-gray-500">An unexpected error occurred. Please try again.</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                        Try again
                    </button>
                    <a href="/home" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                        Dashboard
                    </a>
                </div>
            </div>
        </main>
    )
}
