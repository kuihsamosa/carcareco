import Link from 'next/link'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
    return (
        <main className="min-h-[60vh] flex items-center justify-center ">
            <div className="text-center px-4">
                <MagnifyingGlassIcon className="mx-auto size-12 text-gray-300" />
                <h2 className="mt-4 text-lg font-semibold text-gray-900">Page not found</h2>
                <p className="mt-2 text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <Link
                        href="/home"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/home/work"
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Work list
                    </Link>
                </div>
            </div>
        </main>
    )
}
