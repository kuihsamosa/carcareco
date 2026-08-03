import { type Metadata } from 'next';
import Main from "../_components/Main";
import Search from "../_components/Search";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchInput from "../_components/SearchInput";
import SearchButton from "@/_components/SearchButton";
import InvoiceImportDialog from "./_components/InvoiceImportDialog";
import Link from "next/link";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid';

export const metadata: Metadata = { title: 'Invoices' };
import { IWorkIssuance } from "../work/model";

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

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = await searchParams;
  const mergedParams = Promise.resolve({ ...options, issued: 'on' });

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
              <Link
                href={`/home/invoices/${item.id}`}
                className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-secondary"
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
            );
          }}
        >
          <div className="mb-4 flex items-end gap-x-2">
            <div className="flex-1">
              <SearchInput searchParams={mergedParams} placeholder="invoice number, client or vehicle" />
            </div>
            <div className="mb-1">
              <SearchButton id="btnSubmit">Search</SearchButton>
            </div>
          </div>
        </Search>
      </form>
    </Main>
  );
}
