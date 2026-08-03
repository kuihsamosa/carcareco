import clsx from "clsx";
import React from "react";

export function DescriptionItem(
    {
        label,
        value,
        className,
    }: {
        label: string,
        value: React.ReactNode,
        className?: string| undefined,
    }
) {
    return (
        <div className="px-1 sm:py-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-foreground">{label}</dt>
            {value?<dd className={clsx(className&&className,"mt-1 text-sm/6 text-foreground sm:col-span-2 sm:mt-0")}>{value}</dd>:
            <dd className="mt-1  max-w-2xl text-sm/6 text-muted-foreground/50 sm:col-span-2 sm:mt-0">(no data)</dd>}
        </div>
    ) 
}