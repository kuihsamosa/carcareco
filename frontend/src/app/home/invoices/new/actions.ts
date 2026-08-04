'use server'

import { httpPost } from '@/_lib/server/query-api'
import { redirect } from 'next/navigation'

export async function createDirectInvoice(data: {
    clientId?: string | null
    clientName?: string
    clientPhone?: string
    vehicleLine1?: string
    vehicleLine2?: string
    vehicleLine3?: string
    vehicleLine4?: string
    invoiceDate?: string
    isPaid: boolean
    dueDays?: number
    lines: {
        description: string
        quantity: number
        unit: string
        unitPrice: number
        discount: number
    }[]
}) {
    const response = await httpPost({
        url: 'invoices/direct',
        body: {
            clientId: data.clientId || null,
            clientName: data.clientName || null,
            clientPhone: data.clientPhone || null,
            vehicleLine1: data.vehicleLine1 || null,
            vehicleLine2: data.vehicleLine2 || null,
            vehicleLine3: data.vehicleLine3 || null,
            vehicleLine4: data.vehicleLine4 || null,
            invoiceDate: data.invoiceDate || null,
            isPaid: data.isPaid,
            dueDays: data.dueDays ?? null,
            lines: data.lines,
        },
    })
    const result = await response.json()
    redirect(`/home/invoices/${result.workId}?print=1`)
}
