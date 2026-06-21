import Search from '../../../_components/Search';
import moment from 'moment';
import { httpGet } from '@/_lib/server/query-api';
import { IVehicleData } from '../../model';
import BlueBadge from '@/_components/BlueBadge';
import Main from '../../../_components/Main';
import { CardHeader } from '@/_components/Card';
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import EntityTabs from '@/_components/EntityTabs';
import SearchInput from '../../../_components/SearchInput';
import PrimaryButton from '@/_components/PrimaryButton';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const id = (await params).id;
  const data = await httpGet('vehicles/' + id);
  const vehicle = await data.json() as IVehicleData;

  const displayName = [vehicle.producer, vehicle.model, vehicle.regNr].filter(Boolean).join(' — ');

  const rawParams = await searchParams;
  const mergedParams = Promise.resolve({
    ...rawParams,
    history: 'on', // service history = all works (incl. invoiced), not just open ones
    'vehicleId[value]': id,
    'vehicleId[text]': displayName,
  });

  const columns = [
    {
      dataField: 'workNr',
      headerText: 'Work',
      dataFormatter: ({ id: wid, workNr }: { id: string; workNr: string }) => (
        <a href={'/home/work/' + wid}><h5>Work nr. {workNr}</h5></a>
      ),
    },
    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string; clientId: string }) => (
        <a href={'/home/clients/' + clientId}><h5>{clientName}</h5></a>
      ),
    },
    {
      dataField: 'hasRepairs',
      headerText: 'Type',
      dataFormatter: ({ hasRepairs }: { hasRepairs: boolean }) => (
        <div className="flex gap-x-2">{hasRepairs && <BlueBadge text="Repair job" />}</div>
      ),
    },
    {
      dataField: 'startedOn',
      headerText: 'Started on',
      dataFormatter: ({ startedOn }: { startedOn: Date }) => moment(startedOn, true).format('LL'),
    },
    {
      dataField: 'mechanicNames',
      headerText: 'Mechanics',
    },
    {
      dataField: 'notes',
      headerText: 'Description',
      dataFormatter: ({ notes }: { notes: string }) => (
        <p title={notes} className="truncate max-w-[140px] sm:max-w-xs" style={{ marginBottom: '-5px' }}>{notes}</p>
      ),
    },
  ];

  return (
    <Main
      narrow={false}
      header={
        <CardHeader>
          <h3 className="px-1 text-base font-semibold text-gray-900">Vehicle — {displayName}</h3>
          <DisplayOptionsMenu id={id} pageName="vehicles" />
        </CardHeader>
      }
    >
      <EntityTabs basePath={`/home/vehicles/${id}`} />
      <form method="GET">
        <input type="hidden" name="history" value="on" />
        <input type="hidden" name="vehicleId[value]" value={id} />
        <input type="hidden" name="vehicleId[text]" value={displayName} />
        <div className="mt-4">
          <Search searchParams={mergedParams} resourceName="work" pageName={`vehicles/${id}/services`} idField="id" columns={columns}>
            <div className="flex gap-x-2 mb-4 items-end">
              <div className="flex-1">
                <SearchInput searchParams={mergedParams} placeholder="work number or client name" />
              </div>
              <div className="mb-1">
                <PrimaryButton id="btnSubmit">Search</PrimaryButton>
              </div>
            </div>
          </Search>
        </div>
      </form>
    </Main>
  );
}
