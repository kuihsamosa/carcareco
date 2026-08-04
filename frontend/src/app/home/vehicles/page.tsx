import { type Metadata } from 'next';
import clsx from "clsx";
import Search from "../_components/Search";
import Link from "next/link";

export const metadata: Metadata = { title: 'Vehicles' };
import 'car-makes-icons/dist/style.css';
import { SearchCardHeader } from "../_components/SearchCardHeader";
import Main from "../_components/Main";
import SimpleSearchBar from "../_components/SimpleSearchBar";


export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  return <Main header={
    <SearchCardHeader title="Find Vehicles" pageName="vehicles">
    </SearchCardHeader>
  } narrow={false}>
     <form method="GET" > <Search
      searchParams={searchParams}
      resourceName="vehicles"
      emptyAction={<Link href="/home/vehicles/new" className="text-sm font-medium text-primary hover:text-primary/80">+ New vehicle</Link>}
      mobileCardFormatter={(item) => {
        const producerSlug = (item.producer ?? '').trim().replace(' ', '-').toLowerCase();
        return (
          <Link
            href={`/home/vehicles/${item.id}`}
            className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-secondary"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {producerSlug && <i className={clsx('text-xl', 'car-' + producerSlug)} />}
                <span className="text-sm font-semibold text-foreground">
                  {[item.producer, item.model].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
              {item.regNr && (
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {item.regNr}
                </span>
              )}
            </div>
            {item.ownerName && (
              <div className="text-xs text-muted-foreground">Owner: {item.ownerName}</div>
            )}
            {item.vin && (
              <div className="mt-0.5 text-[11px] text-muted-foreground font-mono truncate">VIN: {item.vin}</div>
            )}
          </Link>
        );
      }}
      columns={[

        {
          dataField: 'producer',
          headerText: 'Producer',
          dataClasses: () => {
            return "pl-4 font-medium gray-900 whitespace-nowrap";
          },
          dataFormatter: ({ producer }) => {
            const producerName = (producer ?? '').trim().replace(" ", "-").toLowerCase();
            return (
              <div className="flex items-center " >
                {producerName && <i className={clsx("pr-2 text-2xl", "car-" + producerName)}>  </i>}
                <span className="text-sm">{producer ?? '—'}</span>
              </div>
            );
          }
        },
        {
          dataField: 'model',
          headerText: 'Model',
        },
        {
          dataField: 'regNr',
          headerText: 'RegNr',
          dataFormatter: ({ regNr, id }) => {
            return (
              <Link href={'/home/vehicles/' + id} >
                <span className="font-semibold"> {regNr}</span>
              </Link>
            );
          }
        },
        {
          dataField: 'ownerName',
          headerText: 'Owner',
          dataFormatter: ({ ownerName, ownerId }) => {
            if (!ownerName) return <p className="font-italic text-muted-foreground">No owner</p>;
            return (
              <Link href={'/home/clients/' + ownerId} >
                <span >{ownerName}</span>
              </Link>
            );
          }
        },
        {
          dataField: 'vin',
          headerText: 'VIN',
          dataFormatter: ({ vin, id }) => {
            return (
              <Link href={'/home/vehicles/' + id} >
                <span  >{vin}</span>
              </Link>
            );
          }
        }
      ]}>
        <SimpleSearchBar searchParams={searchParams} placeholder="vin, registration, owner or make ..."></SimpleSearchBar> 
        </Search></form>
   
  </Main>



}