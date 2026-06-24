import { httpGet } from '@/_lib/server/query-api';
import moment from 'moment';
import PricingDownloadLink from '../../work/_components/activity/PricingDownloadLink';

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

function fmt(n: number) {
  return n.toLocaleString('en-MY', { style: 'currency', currency: 'MYR' });
}

// `id` is the work id the invoice belongs to (invoices are keyed by work in the DB).
export default async function InvoiceDetail({ id }: { id: string }) {
  const res = await httpGet(`pricings/invoice/${id}/preview`);

  if (!res.ok) {
    return (
      <main className="lg:pl-62 px-4 py-8">
        <p className="text-sm text-gray-500">No invoice found.</p>
        <a href="/home/invoices" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500">← Back to invoices</a>
      </main>
    );
  }

  const inv = await res.json() as IInvoicePreview;
  const dueDate = moment(inv.issuedOn).add(inv.dueDays, 'days');

  return (
    <main className="lg:pl-62 mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoice #{inv.invoiceNumber}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{moment(inv.issuedOn).format('LL')}</p>
        </div>
        <div className="flex items-center gap-2">
          <PricingDownloadLink name="Invoice" id={id} number={inv.invoiceNumber} hidePaperClip={false} />
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${inv.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {inv.isPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>

      {/* Client + Vehicle */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {inv.clientName && (
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="mb-0.5 text-xs text-gray-400">Client</p>
            <p className="text-sm font-medium text-gray-900">{inv.clientName}</p>
            {inv.clientPhone && <p className="text-xs text-gray-500">{inv.clientPhone}</p>}
          </div>
        )}
        {(inv.vehicleInfo || inv.vehicleRegNr) && (
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="mb-0.5 text-xs text-gray-400">Vehicle</p>
            <p className="text-sm font-medium text-gray-900">{inv.vehicleInfo || inv.vehicleRegNr}</p>
            {inv.vehicleInfo && inv.vehicleRegNr && <p className="text-xs text-gray-500">{inv.vehicleRegNr}</p>}
          </div>
        )}
      </div>

      {/* Payment info */}
      <div className="mb-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-400">Due date</p>
          <p className="font-medium text-gray-900">{dueDate.format('LL')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Payment</p>
          <p className="font-medium capitalize text-gray-900">{inv.paymentType?.toLowerCase().replace('banktransfer', 'Bank transfer').replace('cardpayment', 'Card payment')}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400">Status</p>
          <p className="text-xs font-medium leading-5 text-gray-900">{inv.paymentStatus}</p>
        </div>
      </div>

      {/* Lines */}
      <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
        <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 sm:grid sm:grid-cols-12">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit price</div>
          <div className="col-span-3 text-right">Total</div>
        </div>

        {inv.lines.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No line items</div>
        ) : (
          inv.lines.map((line, i) => (
            <div key={line.nr} className={`px-4 py-3 ${i < inv.lines.length - 1 ? 'border-b border-gray-100' : ''}`}>
              {/* Mobile */}
              <div className="sm:hidden">
                <div className="flex items-start justify-between">
                  <p className="flex-1 pr-2 text-sm font-medium text-gray-900">{line.description}</p>
                  <p className="whitespace-nowrap text-sm font-semibold text-gray-900">{fmt(line.totalWithVat)}</p>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{line.quantity} × {fmt(line.unitPrice)}</p>
              </div>
              {/* Desktop */}
              <div className="hidden items-center sm:grid sm:grid-cols-12">
                <div className="col-span-5 text-sm text-gray-900">{line.description}</div>
                <div className="col-span-2 text-right text-sm text-gray-600">{line.quantity}</div>
                <div className="col-span-2 text-right text-sm text-gray-600">{fmt(line.unitPrice)}</div>
                <div className="col-span-3 text-right text-sm font-medium text-gray-900">{fmt(line.totalWithVat)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex gap-8 text-gray-500">
          <span>Subtotal (excl. VAT)</span>
          <span className="min-w-[80px] text-right font-medium text-gray-700">{fmt(inv.totalWithoutVat)}</span>
        </div>
        <div className="flex gap-8 text-gray-500">
          <span>VAT</span>
          <span className="min-w-[80px] text-right font-medium text-gray-700">{fmt(inv.totalWithVat - inv.totalWithoutVat)}</span>
        </div>
        <div className="mt-1 flex gap-8 border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
          <span>Total (incl. VAT)</span>
          <span className="min-w-[80px] text-right">{fmt(inv.totalWithVat)}</span>
        </div>
      </div>

      {/* Links */}
      <div className="mt-8 flex items-center justify-between">
        <a href="/home/invoices" className="text-sm text-indigo-600 hover:text-indigo-500">← Back to invoices</a>
        <a href={`/home/work/${id}`} className="text-sm text-gray-400 hover:text-gray-600">View work order</a>
      </div>
    </main>
  );
}
