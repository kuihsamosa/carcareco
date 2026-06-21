import { httpGet } from '@/_lib/server/query-api';
import moment from 'moment';

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
  return n.toLocaleString('et-EE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const [id] = (await params).slug;
  const res = await httpGet(`pricings/invoice/${id}/preview`);

  if (!res.ok) {
    return (
      <main className="lg:pl-62 px-4 py-8">
        <p className="text-gray-500 text-sm">No invoice found for this work order.</p>
      </main>
    );
  }

  const inv = await res.json() as IInvoicePreview;
  const dueDate = moment(inv.issuedOn).add(inv.dueDays, 'days');

  return (
    <main className="lg:pl-62 px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoice #{inv.invoiceNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{moment(inv.issuedOn).format('LL')}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inv.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {inv.isPaid ? 'Paid' : 'Unpaid'}
        </span>
      </div>

      {/* Client + Vehicle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {inv.clientName && (
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Client</p>
            <p className="text-sm font-medium text-gray-900">{inv.clientName}</p>
            {inv.clientPhone && <p className="text-xs text-gray-500">{inv.clientPhone}</p>}
          </div>
        )}
        {(inv.vehicleInfo || inv.vehicleRegNr) && (
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Vehicle</p>
            <p className="text-sm font-medium text-gray-900">{inv.vehicleInfo || inv.vehicleRegNr}</p>
            {inv.vehicleInfo && inv.vehicleRegNr && <p className="text-xs text-gray-500">{inv.vehicleRegNr}</p>}
          </div>
        )}
      </div>

      {/* Payment info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-sm">
        <div>
          <p className="text-xs text-gray-400">Due date</p>
          <p className="font-medium text-gray-900">{dueDate.format('LL')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Payment</p>
          <p className="font-medium text-gray-900 capitalize">{inv.paymentType?.toLowerCase().replace('banktransfer', 'Bank transfer').replace('cardpayment', 'Card payment')}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400">Status</p>
          <p className="font-medium text-gray-900 text-xs leading-5">{inv.paymentStatus}</p>
        </div>
      </div>

      {/* Lines */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        {/* Desktop table header */}
        <div className="hidden sm:grid sm:grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit price</div>
          <div className="col-span-1 text-right">Disc.</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {inv.lines.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No line items</div>
        ) : (
          inv.lines.map((line, i) => (
            <div
              key={line.nr}
              className={`px-4 py-3 ${i < inv.lines.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              {/* Mobile layout */}
              <div className="sm:hidden">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-900 flex-1 pr-2">{line.description}</p>
                  <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{fmt(line.totalWithVat)}</p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {line.quantity} {line.unit} × {fmt(line.unitPrice)}
                  {line.discount ? ` − ${line.discount}%` : ''}
                </p>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid sm:grid-cols-12 items-center">
                <div className="col-span-5 text-sm text-gray-900">{line.description}</div>
                <div className="col-span-2 text-right text-sm text-gray-600">{line.quantity} {line.unit}</div>
                <div className="col-span-2 text-right text-sm text-gray-600">{fmt(line.unitPrice)}</div>
                <div className="col-span-1 text-right text-sm text-gray-400">{line.discount ? `${line.discount}%` : '—'}</div>
                <div className="col-span-2 text-right text-sm font-medium text-gray-900">{fmt(line.totalWithVat)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex gap-8 text-gray-500">
          <span>Subtotal (excl. VAT)</span>
          <span className="font-medium text-gray-700 min-w-[80px] text-right">{fmt(inv.totalWithoutVat)}</span>
        </div>
        <div className="flex gap-8 text-gray-500">
          <span>VAT</span>
          <span className="font-medium text-gray-700 min-w-[80px] text-right">{fmt(inv.totalWithVat - inv.totalWithoutVat)}</span>
        </div>
        <div className="flex gap-8 text-base font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-1">
          <span>Total (incl. VAT)</span>
          <span className="min-w-[80px] text-right">{fmt(inv.totalWithVat)}</span>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8">
        <a href={`/home/work/${id}`} className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Back to work order
        </a>
      </div>
    </main>
  );
}
