import { SkeletonLine, SkeletonTable, SkeletonList } from "./Skeleton"

/**
 * Suspense fallback for list routes. Mirrors the <Main> wrapper offset
 * (lg:pl-62) and padding so swapping to the real page causes no layout shift.
 * Cards on mobile, a table skeleton on desktop — matching the list pages.
 */
export default function ListLoading({ title }: { title?: string }) {
    return (
        <main className="lg:pl-62 pb-8" aria-busy="true">
            <div className="px-4 sm:py-10 sm:px-6 lg:px-8 lg:py-6">
                <div className="mb-6 flex items-center justify-between">
                    {title
                        ? <h1 className="text-base font-semibold text-gray-900">{title}</h1>
                        : <SkeletonLine className="h-5 w-40" />}
                    <SkeletonLine className="h-9 w-28 rounded-lg" />
                </div>

                {/* Mobile: card skeletons */}
                <div className="md:hidden">
                    <SkeletonList rows={5} />
                </div>

                {/* Desktop: table skeleton */}
                <div className="hidden md:block">
                    <SkeletonTable rows={8} cols={5} />
                </div>
            </div>
        </main>
    )
}
