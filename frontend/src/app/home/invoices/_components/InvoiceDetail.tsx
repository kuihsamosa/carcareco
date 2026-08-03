import { httpGet } from '@/_lib/server/query-api';
import moment from 'moment';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import PricingDownloadLink from '../../work/_components/activity/PricingDownloadLink';
import PrintButton from './PrintButton';
import CopyButton from '@/_components/CopyButton';
import InvoicePreviewFrame from './InvoicePreviewFrame';

interface IInvoiceLine {
  nr: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number | null;
  total: number;
  totalWithVat: number;
}

interface IInvoicePreview {
  invoiceNumber: number;
  issuedOn: string;
  dueDays: number;
  isPaid: boolean;
  paymentStatus: string;
  paymentType: string;
  clientName: string;
  clientPhone: string;
  vehicleRegNr: string;
  vehicleInfo: string;
  lines: IInvoiceLine[];
  totalWithoutVat: number;
  totalWithVat: number;
}

export default async function InvoiceDetail({ id }: { id: string }) {
  const [previewRes, optionsRes] = await Promise.all([
    httpGet(`pricings/invoice/${id}/preview`),
    httpGet('options'),
  ]);

  if (!previewRes.ok) {
    return (
      <main className=" px-4 py-8">
        <p className="text-sm text-gray-500">No invoice found.</p>
        <Link href="/home/invoices" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to invoices</Link>
      </main>
    );
  }

  const inv = await previewRes.json() as IInvoicePreview;
  const options = optionsRes.ok ? await optionsRes.json() : null;
  const currency = options?.requisites?.currency || 'MYR';
  const dueDate = moment(inv.issuedOn).add(inv.dueDays, 'days');

  function fmt(n: number) {
    return n.toLocaleString('en-MY', { style: 'currency', currency });
  }

  return (
    <main className=" mx-auto max-w-5xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400 mb-4">
        <Link href="/home/invoices" className="hover:text-gray-600 transition-colors">Invoices</Link>
        <ChevronRightIcon className="size-4" />
        <span className="text-gray-700 font-medium">#{inv.invoiceNumber}</span>
      </nav>

      {/* Header bar */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoice #{inv.invoiceNumber}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{moment(inv.issuedOn).format('LL')}</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <PricingDownloadLink name="Invoice" id={id} number={inv.invoiceNumber} hidePaperClip={false} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${inv.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {inv.isPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: summary cards */}
        <div className="space-y-4 lg:col-span-2">
          {/* Client + Vehicle */}
          {inv.clientName && (
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="mb-0.5 text-xs text-gray-400">Client</p>
              <p className="text-sm font-medium text-gray-900">{inv.clientName}</p>
              {inv.clientPhone && <p className="text-xs text-gray-500 inline-flex items-center"><a href={`tel:${inv.clientPhone}`} className="hover:text-indigo-600">{inv.clientPhone}</a><CopyButton text={inv.clientPhone} /></p>}
            </div>
          )}
          {(inv.vehicleInfo || inv.vehicleRegNr) && (
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="mb-0.5 text-xs text-gray-400">Vehicle</p>
              <p className="text-sm font-medium text-gray-900">{inv.vehicleInfo || inv.vehicleRegNr}</p>
              {inv.vehicleInfo && inv.vehicleRegNr && <p className="text-xs text-gray-500 inline-flex items-center">{inv.vehicleRegNr}<CopyButton text={inv.vehicleRegNr} /></p>}
            </div>
          )}

          {/* Payment info */}
          <div className="rounded-lg bg-gray-50 px-4 py-3 space-y-2">
            <div>
              <p className="text-xs text-gray-400">Due date</p>
              <p className="text-sm font-medium text-gray-900">{dueDate.format('LL')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Payment method</p>
              <p className="text-sm font-medium capitalize text-gray-900">{inv.paymentType?.toLowerCase().replace('banktransfer', 'Bank transfer').replace('cardpayment', 'Card payment')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-900">{inv.paymentStatus}</p>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-700 tabular-nums">{fmt(inv.totalWithoutVat)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax</span>
              <span className="font-medium text-gray-700 tabular-nums">{fmt(inv.totalWithVat - inv.totalWithoutVat)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
              <span>Total</span>
              <span className="tabular-nums">{fmt(inv.totalWithVat)}</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between pt-2">
            <Link href="/home/invoices" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; Back to invoices</Link>
            <Link href={`/home/work/${id}`} className="text-sm text-gray-400 hover:text-gray-600">View work order</Link>
          </div>
        </div>

        {/* Right: rendered invoice document */}
        <div className="lg:col-span-3">
          <InvoicePreviewFrame workId={id} />
        </div>
      </div>
    </main>
  );
}
