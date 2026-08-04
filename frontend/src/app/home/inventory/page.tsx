import { type Metadata } from 'next';
import { Fragment } from "react";
import Search from "../_components/Search";
import Link from "next/link";

export const metadata: Metadata = { title: 'Inventory' };
import Main from "../_components/Main";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SimpleSearchBar from "../_components/SimpleSearchBar";

 
export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const columns = [
    {
      dataField: 'code',
      headerText: 'Product code',
      dataFormatter: ({ code, id }: { code: string, id: string }) => {
        return (
          <Link href={'/home/inventory/' + id} >
            <span className="mb-0 fs--1">{code} </span>
          </Link>
        );
      }
    },
    {
      dataField: 'name',
      headerText: 'Nimi',
      dataFormatter: ({ name }: { name: string }) => {
        return <p title={name} className="truncate" style={{ maxWidth: '500px', marginBottom: "-5px" }} >
          {name}
        </p>
      }
    },
    {
      dataField: 'price',
      headerText: 'Price',
      dataFormatter: ({ price }: { price?: number }) => {
        return (
          <Fragment>
            {price&&'RM '}{price?.toFixed(2)}
          </Fragment>
        )
      },
    },
    {
      dataField: 'quantity',
      headerText: 'Quantity',
    },
    {
      dataField: 'discount',
      headerText: 'Discount',
      dataFormatter: ({ discount }: { discount?: number }) => {
        return (
          <Fragment>
            {discount?.toFixed(0)} {discount&&'%'} 
          </Fragment>
        )
      },
    },
    {
      dataField: 'storageName',
      headerText: 'Location'
    }
  ];
   
  return (
 
      <Main  header={
        <SearchCardHeader title="Find Inventory" pageName="inventory">
      </SearchCardHeader>
      } narrow={false}>
        <form method="GET" > <Search searchParams={searchParams} pageName="inventory" resourceName="spareparts" columns={columns}
          emptyAction={<Link href="/home/inventory/new" className="text-sm font-medium text-primary hover:text-primary/80">+ New spare part</Link>}
          mobileCardFormatter={(item) => (
            <Link
              href={`/home/inventory/${item.id}`}
              className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-secondary"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{item.code}</span>
                {item.price != null && (
                  <span className="text-sm font-semibold text-foreground tabular-nums">RM {Number(item.price).toFixed(2)}</span>
                )}
              </div>
              <div className="text-sm font-medium text-foreground truncate">{item.name || '—'}</div>
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                {item.quantity != null && <span>Qty: {item.quantity}</span>}
                {item.discount > 0 && <span>Disc: {Number(item.discount).toFixed(0)}%</span>}
                {item.storageName && <span className="truncate">{item.storageName}</span>}
              </div>
            </Link>
          )}
        >
          <SimpleSearchBar searchParams={searchParams} placeholder="code or name ..."></SimpleSearchBar>
          </Search></form>
      </Main> 
  )

} 