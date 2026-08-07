'use client'

import React, { useRef, useTransition } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import ConfirmDialog, { ConfirmDialogHandle } from '@/_components/ConfirmDialog'
import { deleteInvoices } from '../actions'

export default function DeleteInvoiceButton({
  workId,
  invoiceNumber,
  compact = false,
  redirectTo,
}: {
  workId: string
  invoiceNumber?: number
  compact?: boolean
  /** Where to go after deleting — needed on the invoice detail page, whose URL dies with it. */
  redirectTo?: string
}) {
  const confirmRef = useRef<ConfirmDialogHandle>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        aria-label={`Delete invoice #${invoiceNumber ?? ''}`}
        title="Delete invoice"
        onClick={(e) => {
          // The row is wrapped in links on mobile — don't navigate on delete.
          e.preventDefault()
          e.stopPropagation()
          confirmRef.current?.open({
            title: `Delete invoice #${invoiceNumber ?? ''}?`,
            description:
              'This permanently removes the invoice, its line items and the work order behind it. The invoice number becomes free again. The client and vehicle records are kept.',
            confirmObj: workId,
            variant: 'danger',
          })
        }}
        className={
          compact
            ? 'inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors'
            : 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors'
        }
      >
        <TrashIcon className="size-4" />
        {!compact && <span>Delete</span>}
      </button>

      <ConfirmDialog
        ref={confirmRef}
        onConfirm={(id: string) =>
          new Promise<void>((resolve) => {
            startTransition(async () => {
              await deleteInvoices([id], redirectTo)
              resolve()
            })
          })
        }
      />
    </>
  )
}
