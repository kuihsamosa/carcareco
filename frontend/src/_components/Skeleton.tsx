import clsx from "clsx"

export function SkeletonLine({ className }: { className?: string }) {
    return (
        <div className={clsx("animate-pulse bg-gray-200 rounded", className)} />
    )
}

export function SkeletonAvatar({ className }: { className?: string }) {
    return (
        <div className={clsx("animate-pulse bg-gray-200 rounded-full", className)} />
    )
}

export function SkeletonCard() {
    return (
        <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
            <SkeletonAvatar className="w-9 h-9 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
                <SkeletonLine className="h-3 w-3/5" />
                <SkeletonLine className="h-2 w-2/5" />
            </div>
            <SkeletonLine className="h-5 w-20 rounded-full" />
        </div>
    )
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
    return (
        <div className="overflow-hidden">
            <div className="flex gap-4 px-4 py-2 border-b border-gray-100 mb-1">
                {Array.from({ length: cols }).map((_, i) => (
                    <SkeletonLine key={i} className="h-3 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <SkeletonLine key={j} className={clsx("h-3 flex-1", j === 0 && "w-2/3 flex-none")} />
                    ))}
                </div>
            ))}
        </div>
    )
}
