import Search from '../../../_components/Search';
import moment from 'moment';
import Link from 'next/link';
import { httpGet } from '@/_lib/server/query-api';
import { IClientData } from '../../model';
import BlueBadge from '@/_components/BlueBadge';
import Main from '../../../_components/Main';
import { CardHeader } from '@/_components/Card';
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import EntityTabs from '@/_components/EntityTabs';
import SearchInput from '../../../_components/SearchInput';
import SearchButton from '@/_components/SearchButton';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const id = (await params).id;
  const data = await httpGet('clients/' + id);
  const client = await data.json() as IClientData;

  const rawParams = await searchParams;
  const mergedParams = Promise.resolve({
    ...rawParams,
    history: 'on', // service history = all works (incl. invoiced), not just open ones
    'clientiId[value]': id,
    'clientiId[text]': client.isPrivate ? `${client.firstName} ${client.lastName}` : client.name,
  });

  const columns = [
    {
      dataField: 'workNr',
      headerText: 'Work',
      dataFormatter: ({ id: wid, workNr }: { id: string; workNr: string }) => (
        <Link href={'/home/work/' + wid}><span>{workNr}</span></Link>
      ),
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string; vehicleId: string }) => (
        <Link href={'/home/vehicles/' + vehicleId}><span>{regNr}</span></Link>
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

  const displayName = client.isPrivate ? `${client.firstName} ${client.lastName}` : client.name;

  return (
    <Main
      narrow={false}
      header={
        <CardHeader>
          <h3 className="px-1 lg:px-0 text-base font-semibold text-foreground">{displayName}</h3>
          <DisplayOptionsMenu id={id} pageName="clients" />
        </CardHeader>
      }
    >
      <EntityTabs basePath={`/home/clients/${id}`} />
      <form method="GET">
        <input type="hidden" name="history" value="on" />
        <input type="hidden" name="clientiId[value]" value={id} />
        <input type="hidden" name="clientiId[text]" value={displayName} />
        <div className="mt-4">
          <Search searchParams={mergedParams} resourceName="work" pageName={`clients/${id}/services`} idField="id" columns={columns}
            mobileCardFormatter={(item) => (
              <Link
                href={`/home/work/${item.id}`}
                className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-secondary"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">Work #{item.workNr}</span>
                  <span className="text-[11px] text-muted-foreground">{moment(item.startedOn).format('ll')}</span>
                </div>
                {item.regNr && (
                  <span className="inline-block rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {item.regNr}
                  </span>
                )}
                {item.hasRepairs && (
                  <span className="ml-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Repair</span>
                )}
                {item.notes && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                )}
              </Link>
            )}
          >
            <div className="flex gap-x-2 mb-4 items-end">
              <div className="flex-1">
                <SearchInput searchParams={mergedParams} placeholder="work number or vehicle registration" />
              </div>
              <div className="mb-1">
                <SearchButton id="btnSubmit">Search</SearchButton>
              </div>
            </div>
          </Search>
        </div>
      </form>
    </Main>
  );
}
