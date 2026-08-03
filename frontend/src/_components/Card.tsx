import clsx from "clsx";

export function CardHeader({
    title,
    description,
    children,
}: {
    title?: string | undefined,
    description?:string | undefined,
    children?: React.ReactNode
}) {
    return (
        <div className=" py-2  px-2 pt-8  xl:py-4  xl:pt-8 xl:px-6">

            <div className="-mt-2  flex items-center justify-between  flex-wrap gap-y-2">
                {title && <div className="xl:mt-2  pb-2">
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    {description&&<p className="mt-1 max-w-2xl text-sm/6 text-muted-foreground">{description}</p>}
                </div>}
                {children}
            </div>

        </div>

    )
}

export async function Card({   header, children }: {  header?: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className={clsx("sm:divide-y sm:divide-border overflow-hidden sm:rounded-lg bg-card sm:shadow-sm")}>
            {header}
            <div className="overflow-hidden px-2 sm:p-4 xl:p-6">{children}</div>
        </div>
    );
}
