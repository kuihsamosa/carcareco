import clsx from "clsx"

export interface IButtonClick {
    (event: React.MouseEvent): void
}

export default function PrimaryButton({
    id,
    children,
    onClick,
    className,
    disabled,
    loading,
    success,
}: {
    id?: string | undefined,
    children: React.ReactNode,
    onClick?: IButtonClick,
    className?: string | undefined,
    disabled?: boolean | undefined,
    loading?: boolean | undefined,
    success?: boolean | undefined,
}) {
    return (
        <button
            id={id}
            disabled={disabled || loading}
            type="submit"
            onClick={onClick}
            className={clsx(
                className,
                success
                    ? "rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white shadow-xs"
                    : "rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800",
                (disabled || loading) && "opacity-60 cursor-not-allowed min-h-[44px] min-w-[44px]",
                "min-h-[44px] min-w-[44px] flex items-center justify-center gap-2"
            )}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12 0v4a8 8 0 00-8 8H0z"></path>
                </svg>
            )}
            {success && (
                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {children}
        </button>
    )
}
