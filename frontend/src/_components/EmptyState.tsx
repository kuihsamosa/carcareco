import clsx from "clsx"

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: {
    icon?: React.ReactNode,
    title: string,
    description?: string,
    action?: React.ReactNode,
    className?: string,
}) {
    return (
        <div className={clsx(
            "flex flex-col items-center justify-center text-center py-12 px-6",
            "border border-dashed border-gray-200 rounded-lg bg-gray-50",
            className
        )}>
            {icon && (
                <div className="text-gray-300 mb-4 text-5xl leading-none">
                    {icon}
                </div>
            )}
            <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
            {description && (
                <p className="text-sm text-gray-500 mb-5 max-w-xs">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    )
}
