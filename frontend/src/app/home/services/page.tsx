import Search from "../_components/Search";
import moment from "moment";
import { Card } from "@/_components/Card";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchInput from "../_components/SearchInput";
import PrimaryButton from "@/_components/PrimaryButton";
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
        <a href={'/home/work/' + id}>
          <span>{workNr}</span>
        </a>
      ),
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string; vehicleId: string }) => (
        <a href={'/home/vehicles/' + vehicleId}>
          <span>{regNr}</span>
        </a>
      ),
    },
    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string; clientId: string }) => (
        <a href={'/home/clients/' + clientId}>
          <span>{clientName}</span>
        </a>
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
      dataFormatter: ({ startedOn }: { startedOn: Date }) =>
        moment(startedOn, true).format('LL'),
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
                  <PrimaryButton id="btnSubmit">Search</PrimaryButton>
                </div>
              </div>
            </Search>
          </Card>
        </div>
      </form>
    </main>
  );
}
