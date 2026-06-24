import Main from "../_components/Main";
import Search from "../_components/Search";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchInput from "../_components/SearchInput";
import PrimaryButton from "@/_components/PrimaryButton";
import moment from "moment";
import { IWorkIssuance } from "../work/model";

// Invoices are their own section. They are backed by issued work orders in the
// DB (every invoice belongs to a work), but the UI treats them as standalone:
// this list, the /home/invoices/[id] detail, and a New Invoice flow.

function PaidPill({ issuance }: { issuance?: IWorkIssuance }) {
  if (!issuance) return null;
  const overdue = !issuance.isPaid && issuance.issuedOn
    && moment(issuance.issuedOn).add(issuance.dueDays ?? 0, 'days').isBefore(moment());
  if (issuance.isPaid) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Paid</span>;
  if (overdue) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Overdue</span>;
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Unpaid</span>;
}

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = await searchParams;
  // issued=on tells the work/page endpoint to return invoiced works only.
  const mergedParams = Promise.resolve({ ...options, issued: 'on' });

  const columns = [
    {
      dataField: 'issuance',
      headerText: 'Invoice',
      dataFormatter: ({ issuance, id }: { issuance: IWorkIssuance; id: string }) => (
        <a href={'/home/invoices/' + id} className="font-semibold text-gray-900">
          #{issuance?.invoiceNumber}
        </a>
      ),
    },
    {
      dataField: 'issuedOn',
      headerText: 'Issued',
      dataFormatter: ({ issuance }: { issuance: IWorkIssuance }) =>
        issuance?.issuedOn ? moment(issuance.issuedOn).format('LL') : '—',
    },
    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string; clientId: string }) => (
        <a href={'/home/clients/' + clientId} className="text-gray-700">{clientName || '—'}</a>
      ),
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string; vehicleId: string }) => (
        <a href={'/home/vehicles/' + vehicleId} className="text-gray-500">{regNr}</a>
      ),
    },
    {
      dataField: 'status',
      headerText: 'Status',
      dataFormatter: ({ issuance }: { issuance: IWorkIssuance }) => <PaidPill issuance={issuance} />,
    },
  ];

  return (
    <Main narrow={false} header={<SearchCardHeader title="Invoices" pageName="invoices" />}>
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
              <a
                href={`/home/invoices/${item.id}`}
                className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors active:bg-gray-50"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Invoice #{issuance?.invoiceNumber}</span>
                  <PaidPill issuance={issuance} />
                </div>
                <div className="text-[11px] text-gray-400">
                  {issuance?.issuedOn ? moment(issuance.issuedOn).format('ll') : ''}
                </div>
                {item.clientName && <div className="mt-1 text-xs text-gray-600">{item.clientName}</div>}
                {item.vehicleRegNr && (
                  <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    {item.vehicleRegNr}
                  </span>
                )}
              </a>
            );
          }}
        >
          <div className="mb-4 flex items-end gap-x-2">
            <div className="flex-1">
              <SearchInput searchParams={mergedParams} placeholder="invoice number, client or vehicle" />
            </div>
            <div className="mb-1">
              <PrimaryButton id="btnSubmit">Search</PrimaryButton>
            </div>
          </div>
        </Search>
      </form>
    </Main>
  );
}
