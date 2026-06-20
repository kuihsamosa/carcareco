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

  const columns = [
    {
      dataField: 'workNr',
      headerText: 'Work',
      dataFormatter: ({ id, workNr }: { id: string; workNr: string }) => (
        <a href={'/home/work/' + id}>
          <h5>Work nr. {workNr}</h5>
        </a>
      ),
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string; vehicleId: string }) => (
        <a href={'/home/vehicles/' + vehicleId}>
          <h5>{regNr}</h5>
        </a>
      ),
    },
    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string; clientId: string }) => (
        <a href={'/home/clients/' + clientId}>
          <h5>{clientName}</h5>
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
        <p title={notes} className="truncate" style={{ maxWidth: '300px', marginBottom: '-5px' }}>
          {notes}
        </p>
      ),
    },
  ];

  return (
    <main className="lg:pl-62">
      <form method="GET">
        <div className="sm:py-6 px-4 sm:px-8 sm:gap-4">
          <Card
            header={
              <SearchCardHeader title="Service History" pageName="work">
              </SearchCardHeader>
            }
          >
            <Search
              searchParams={searchParams}
              resourceName="work"
              pageName="services"
              idField="id"
              columns={columns}
            >
              <div className="flex gap-x-2 mb-4 items-end">
                <div className="flex-1">
                  <SearchInput
                    searchParams={searchParams}
                    placeholder="work number, client, vehicle reg nr. or VIN"
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
