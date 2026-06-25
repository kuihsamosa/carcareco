'use client'

import { useFormStatus } from 'react-dom'
import PrimaryButton, { IButtonClick } from './PrimaryButton'

/**
 * Submit button for server-action forms. Uses useFormStatus so it shows a
 * spinner and disables itself while the action is in flight — giving the user
 * feedback after pressing Save and preventing accidental double-submits.
 *
 * onClick still runs first (e.g. client-side validation that may
 * preventDefault); if it cancels the submit, pending never flips on.
 */
export default function SubmitButton({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode
    onClick?: IButtonClick
    className?: string
}) {
    const { pending } = useFormStatus()
    return (
        <PrimaryButton loading={pending} onClick={onClick} className={className}>
            {children}
        </PrimaryButton>
    )
}
