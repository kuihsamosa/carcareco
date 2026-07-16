import Search from "../_components/Search";
import moment from "moment";
import Link from "next/link";
import { Card } from "@/_components/Card";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchInput from "../_components/SearchInput";
import SearchButton from "@/_components/SearchButton";
import BlueBadge from "@/_components/BlueBadge";

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = await searchParams;
  // service history = all works (incl. invoiced), not just open ones
  const mergedParams = Promise.resolve({ ...options, history: 'on' });

  const columns = [
    {
      dataField: 'workNr',
      headerText: 'Work',
      dataFormatter: ({ id, workNr }: { id: string; workNr: string }) => (
        <Link href={'/home/work/' + id}>
          <span>{workNr}</span>
        </Link>
      ),
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string; vehicleId: string }) => (
        <Link href={'/home/vehicles/' + vehicleId}>
          <span>{regNr}</span>
        </Link>
      ),
    },
    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string; clientId: string }) => (
        <Link href={'/home/clients/' + clientId}>
          <span>{clientName}</span>
        </Link>
      ),
    },
    {
      dataField: 'hasRepairs',
      headerText: 'Type',
      dataFormatter: ({ hasRepairs }: { hasRepairs: boolean }) => (
        <div className="flex gap-x-2">
          {hasRepairs && <BlueBadge text="Repair job" />}
        </div>
      ),
    },
    {
      dataField: 'startedOn',
      headerText: 'Started on',
      dataFormatter: ({ startedOn }: { startedOn: Date }) => {
        const m = moment(startedOn, true);
        return <span title={m.format('LL')}>{m.fromNow()}</span>;
      },
    },
    {
      dataField: 'mechanicNames',
      headerText: 'Mechanics',
    },
    {
      dataField: 'notes',
      headerText: 'Description',
      dataFormatter: ({ notes }: { notes: string }) => (
        <p title={notes} className="truncate max-w-[140px] sm:max-w-xs" style={{ marginBottom: '-5px' }}>
          {notes}
        </p>
      ),
    },
  ];

  return (
    <main className="lg:pl-62">
      <form method="GET">
        <input type="hidden" name="history" value="on" />
        <div className="sm:py-6 px-4 sm:px-8 sm:gap-4">
          <Card
            header={
              <SearchCardHeader title="Service History" pageName="work">
              </SearchCardHeader>
            }
          >
            <Search
              searchParams={mergedParams}
              resourceName="work"
              pageName="services"
              idField="id"
              columns={columns}
            >
              <div className="flex gap-x-2 mb-4 items-end">
                <div className="flex-1">
                  <SearchInput
                    searchParams={mergedParams}
                    placeholder="work number, client, vehicle registration or VIN"
                  />
                </div>
                <div className="mb-1">
                  <SearchButton id="btnSubmit">Search</SearchButton>
                </div>
              </div>
            </Search>
          </Card>
        </div>
      </form>
    </main>
  );
}
