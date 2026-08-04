import { type Metadata } from 'next';
import Main from "../_components/Main";
import Search from "../_components/Search";
import Link from "next/link";

export const metadata: Metadata = { title: 'Clients' };
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SimpleSearchBar from "../_components/SimpleSearchBar";
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from "@heroicons/react/20/solid";

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {


  return <Main header={
    <SearchCardHeader title="Find Clients" pageName="clients">
    </SearchCardHeader>
  } narrow={false}>
    <form method="GET" > <Search
      searchParams={searchParams}
      resourceName="clients"
      emptyAction={<Link href="/home/clients/new" className="text-sm font-medium text-primary hover:text-primary/80">+ New client</Link>}
      mobileCardFormatter={(item) => (
        <Link
          href={`/home/clients/${item.id}`}
          className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-secondary"
        >
          <div className="text-sm font-semibold text-foreground">{item.name || '—'}</div>
          {item.phone && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <PhoneIcon className="size-3.5 shrink-0" />
              {item.phone}
            </div>
          )}
          {item.email && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <EnvelopeIcon className="size-3.5 shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          )}
          {item.address && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0" />
              <span className="truncate">{item.address}</span>
            </div>
          )}
        </Link>
      )}
      columns={[{
        dataField: "name",
        dataFormatter: ({ id, name }) => {
          return (
            <Link href={'/home/clients/' + id}>
              {name}
            </Link>
          );
        }
      }, {
        dataField: "phone",
      }, {
        dataField: "email",
      }, {
        dataField: "address",
      }]}>

      <SimpleSearchBar searchParams={searchParams} placeholder="name, address or phone ..."></SimpleSearchBar>
    </Search></form>

  </Main>


}