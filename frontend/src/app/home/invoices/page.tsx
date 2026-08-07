import { type Metadata } from 'next';
import Main from "../_components/Main";
import Search from "../_components/Search";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchInput from "../_components/SearchInput";
import SearchButton from "@/_components/SearchButton";
import InvoiceImportDialog from "./_components/InvoiceImportDialog";
import DeleteInvoiceButton from "./_components/DeleteInvoiceButton";
import Link from "next/link";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid';

export const metadata: Metadata = { title: 'Invoices' };
import { IWorkIssuance } from "../work/model";

const MONTHS = [
  { value: '', label: 'All months' },
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

function PaidPill({ issuance }: { issuance?: IWorkIssuance }) {
  if (!issuance) return null;
  const overdue = !issuance.isPaid && issuance.issuedOn
    && moment(issuance.issuedOn).add(issuance.dueDays ?? 0, 'days').isBefore(moment());
  if (issuance.isPaid) return (
    <Badge variant="outline" className="border-success/30 bg-success/10 text-success gap-1">
      <CheckCircleIcon className="size-3" /> Paid
    </Badge>
  );
  if (overdue) return (
    <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1">
      <ExclamationTriangleIcon className="size-3" /> Overdue
    </Badge>
  );
  return (
    <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning gap-1">
      <ClockIcon className="size-3" /> Unpaid
    </Badge>
  );
}

function NeedsClientBadge({ clientName }: { clientName?: string }) {
  if (clientName && clientName.trim()) return null;
  return (
    <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning gap-1 text-[10px]">
      <ExclamationTriangleIcon className="size-3" /> Needs client
    </Badge>
  );
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: { value: string; label: string }[] = [{ value: '', label: 'All years' }];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = await searchParams;

  // Convert month/year into invoiceFrom/invoiceTo for the backend
  const merged: Record<string, string> = { ...options, issued: 'on' };
  const filterYear = options.year ? parseInt(options.year) : 0;
  const filterMonth = options.month ? parseInt(options.month) : 0;

  if (filterYear > 0 && filterMonth > 0) {
    const from = new Date(filterYear, filterMonth - 1, 1);
    const to = new Date(filterYear, filterMonth, 1);
    merged.invoiceFrom = from.toISOString();
    merged.invoiceTo = to.toISOString();
  } else if (filterYear > 0) {
    merged.invoiceFrom = new Date(filterYear, 0, 1).toISOString();
    merged.invoiceTo = new Date(filterYear + 1, 0, 1).toISOString();
  }
  // Remove month/year so they don't get sent as unknown params to the backend
  delete merged.month;
  delete merged.year;

  const mergedParams = Promise.resolve(merged);
  const yearOptions = buildYearOptions();

  const columns = [
    {
      dataField: 'issuance',
      headerText: 'Invoice',
      dataFormatter: ({ issuance, id }: { issuance: IWorkIssuance; id: string }) => (
        <Link href={'/home/invoices/' + id} className="font-semibold text-foreground tabular-nums">
          #{issuance?.invoiceNumber}
        </Link>
      ),
    },
    {
      dataField: 'issuedOn',
      headerText: 'Issued',
      dataFormatter: ({ issuance }: { issuance: IWorkIssuance }) =>
        issuance?.issuedOn ? <span className="text-muted-foreground" title={moment(issuance.issuedOn).format('LL')}>{moment(issuance.issuedOn).fromNow()}</span> : '—',
    },
    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string; clientId: string }) => (
        <span className="flex items-center gap-2">
          <Link href={'/home/clients/' + clientId} className="text-foreground">{clientName || '—'}</Link>
          <NeedsClientBadge clientName={clientName} />
        </span>
      ),
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string; vehicleId: string }) => (
        <Link href={'/home/vehicles/' + vehicleId} className="text-muted-foreground">{regNr}</Link>
      ),
    },
    {
      dataField: 'status',
      headerText: 'Status',
      dataFormatter: ({ issuance }: { issuance: IWorkIssuance }) => <PaidPill issuance={issuance} />,
    },
    {
      dataField: 'actions',
      headerText: <span className="sr-only">Delete</span>,
      headerClasses: () => 'relative py-3.5 px-3 w-px',
      dataClasses: () => 'px-3 py-4 text-right whitespace-nowrap w-px',
      dataFormatter: ({ issuance, id }: { issuance: IWorkIssuance; id: string }) => (
        <DeleteInvoiceButton workId={id} invoiceNumber={issuance?.invoiceNumber} compact />
      ),
    },
  ];

  return (
    <Main narrow={false} header={<SearchCardHeader title="Invoices" pageName="invoices"><InvoiceImportDialog /></SearchCardHeader>}>
      <form method="GET">
        <input type="hidden" name="issued" value="on" />
        <Search
          searchParams={mergedParams}
          resourceName="work"
          pageName="invoices"
          idField="id"
          editable={false}
          columns={columns}
          mobileCardFormatter={(item) => {
            const issuance = item.issuance as IWorkIssuance | undefined;
            return (
              <div className="relative rounded-xl border border-border bg-card shadow-sm">
                {/* Kept outside the Link: a button nested in an anchor is invalid
                    markup and the tap would navigate instead of deleting. */}
                <div className="absolute bottom-2 right-2 z-10">
                  <DeleteInvoiceButton workId={item.id} invoiceNumber={issuance?.invoiceNumber} compact />
                </div>
              <Link
                href={`/home/invoices/${item.id}`}
                className="block rounded-xl p-4 pr-12 transition-colors active:bg-secondary"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground tabular-nums">Invoice #{issuance?.invoiceNumber}</span>
                  <PaidPill issuance={issuance} />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {issuance?.issuedOn ? moment(issuance.issuedOn).format('ll') : ''}
                </div>
                {item.clientName && <div className="mt-1 text-xs text-foreground">{item.clientName}</div>}
                <NeedsClientBadge clientName={item.clientName} />
                {item.vehicleRegNr && (
                  <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.vehicleRegNr}
                  </span>
                )}
              </Link>
              </div>
            );
          }}
        >
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px]">
              <SearchInput searchParams={mergedParams} placeholder="invoice number, client or vehicle" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
              <select
                name="month"
                defaultValue={options.month ?? ''}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
              <select
                name="year"
                defaultValue={options.year ?? ''}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {yearOptions.map(y => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-0.5">
              <SearchButton id="btnSubmit">Search</SearchButton>
            </div>
          </div>
        </Search>
      </form>
    </Main>
  );
}
