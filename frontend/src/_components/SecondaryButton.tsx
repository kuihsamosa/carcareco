import clsx from "clsx"
import { IButtonClick } from "./PrimaryButton"

export default function SecondaryButton({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode,
    onClick: IButtonClick,
    className?: string | undefined
}) {
    return (
        <button type="button" onClick={(e) => onClick(e)} className={clsx(className, "rounded-md bg-card px-3 py-2 text-sm font-semibold text-foreground ring-1 shadow-xs ring-border ring-inset hover:bg-secondary min-h-[44px] min-w-[44px]")}>
            {children}
        </button>
    )
}