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
        <form method="GET" > <Search searchParams={searchParams} pageName="inventory" resourceName="spareparts" columns={columns} emptyAction={<Link href="/home/inventory/new" className="text-sm font-medium text-primary hover:text-primary/80">+ New spare part</Link>}>
          <SimpleSearchBar searchParams={searchParams} placeholder="code or name ..."></SimpleSearchBar>
          </Search></form>
      </Main> 
  )

} 