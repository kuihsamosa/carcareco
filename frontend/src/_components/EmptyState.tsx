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
            "border border-dashed border-border rounded-lg bg-secondary",
            className
        )}>
            {icon && (
                <div className="text-muted-foreground/50 mb-4 text-5xl leading-none">
                    {icon}
                </div>
            )}
            <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
            {description && (
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    )
}
