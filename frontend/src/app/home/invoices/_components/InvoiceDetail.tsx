import { httpGet } from '@/_lib/server/query-api';
import moment from 'moment';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid';
import InvoiceDownloadButton from './InvoiceDownloadButton';
import CopyButton from '@/_components/CopyButton';
import InvoicePreviewFrame from './InvoicePreviewFrame';
import { Badge } from '@/components/ui/badge';

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
      <main className="px-4 py-8">
        <p className="text-sm text-muted-foreground">No invoice found.</p>
        <Link href="/home/invoices" className="mt-2 inline-block text-sm text-primary hover:underline">&larr; Back to invoices</Link>
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

  const statusBadge = inv.isPaid
    ? <Badge variant="outline" className="border-success/30 bg-success/10 text-success gap-1"><CheckCircleIcon className="size-3" /> Paid</Badge>
    : moment().isAfter(dueDate)
      ? <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1"><ExclamationTriangleIcon className="size-3" /> Overdue</Badge>
      : <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning gap-1"><ClockIcon className="size-3" /> Unpaid</Badge>;

  const noClient = !inv.clientName || !inv.clientName.trim();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/home/invoices" className="hover:text-foreground transition-colors">Invoices</Link>
        <ChevronRightIcon className="size-4" />
        <span className="text-foreground font-medium">#{inv.invoiceNumber}</span>
      </nav>

      {noClient && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <ExclamationTriangleIcon className="size-5 text-warning shrink-0" />
          <p className="text-sm text-foreground">This invoice has no client on record.</p>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tabular-nums">Invoice #{inv.invoiceNumber}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{moment(inv.issuedOn).format('LL')}</p>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}
          <InvoiceDownloadButton id={id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {inv.clientName && (
            <div className="rounded-lg bg-card border border-border px-4 py-3">
              <p className="mb-0.5 text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium text-foreground">{inv.clientName}</p>
              {inv.clientPhone && <p className="text-xs text-muted-foreground inline-flex items-center"><a href={`tel:${inv.clientPhone}`} className="hover:text-primary">{inv.clientPhone}</a><CopyButton text={inv.clientPhone} /></p>}
            </div>
          )}
          {(inv.vehicleInfo || inv.vehicleRegNr) && (
            <div className="rounded-lg bg-card border border-border px-4 py-3">
              <p className="mb-0.5 text-xs text-muted-foreground">Vehicle</p>
              <p className="text-sm font-medium text-foreground">{inv.vehicleInfo || inv.vehicleRegNr}</p>
              {inv.vehicleInfo && inv.vehicleRegNr && <p className="text-xs text-muted-foreground inline-flex items-center">{inv.vehicleRegNr}<CopyButton text={inv.vehicleRegNr} /></p>}
            </div>
          )}

          <div className="rounded-lg bg-card border border-border px-4 py-3 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="text-sm font-medium text-foreground">{dueDate.format('LL')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment method</p>
              <p className="text-sm font-medium capitalize text-foreground">{inv.paymentType?.toLowerCase().replace('banktransfer', 'Bank transfer').replace('cardpayment', 'Card payment')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium text-foreground">{inv.paymentStatus}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground tabular-nums">{fmt(inv.totalWithoutVat)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax</span>
              <span className="font-medium text-foreground tabular-nums">{fmt(inv.totalWithVat - inv.totalWithoutVat)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">{fmt(inv.totalWithVat)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/home/invoices" className="text-sm text-primary hover:underline">&larr; Back to invoices</Link>
            <Link href={`/home/work/${id}`} className="text-sm text-muted-foreground hover:text-foreground">View work order</Link>
          </div>
        </div>

        <div className="lg:col-span-3">
          <InvoicePreviewFrame workId={id} />
        </div>
      </div>
    </main>
  );
}
