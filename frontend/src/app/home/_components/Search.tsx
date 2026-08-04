import clsx from "clsx";
import Link from "next/link";
import React  from "react";
import { httpGet } from "@/_lib/server/query-api";
import EmptyState from "@/_components/EmptyState";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
interface DataResult {
  hasMore: boolean,
  items: Record<string, string>[]
}

interface DataRowModel {
  dataField: string,
  headerText?: React.ReactNode,
  headerClasses?(index: number): string | undefined,
  dataClasses?(item: Record<string, any>, index: number): string | undefined,// eslint-disable-line @typescript-eslint/no-explicit-any
  sort?: boolean | undefined,
  dataFormatter?(item: Record<string, any>, colIndex: number): React.ReactNode | undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default async function Search(
  {
    searchParams,
    resourceName,
    pageName,
    columns = [],
    rowClass,
    idField = 'id',
    children,
    mobileCardFormatter,
    editable = true,
    emptyAction,
  }: {
    searchParams: Promise<Record<string, string>>
    resourceName: string,
    pageName?: string | undefined | null,
    idField?: string | undefined,
    columns?: DataRowModel[],
    rowClass? (item:any):string // eslint-disable-line @typescript-eslint/no-explicit-any
    children?: React.ReactNode
    mobileCardFormatter?: (item: Record<string, any>) => React.ReactNode // eslint-disable-line @typescript-eslint/no-explicit-any
    editable?: boolean
    emptyAction?: React.ReactNode
  }) {

  if (!pageName) pageName = resourceName;
  let options = (await searchParams);
  const offset = parseInt(options.offset ?? 0);
  const limit = parseInt(options.limit ?? 30);
  options = {
    ...options,
    offset: offset.toString(),
    limit: limit.toString()
  };
  const queryString = new URLSearchParams(options).toString();
  const page = '/home/' + pageName + '?';
  const hasFilters = Object.entries(options).some(([k, v]) => !['offset', 'limit'].includes(k) && v);
  const nextPage = page + new URLSearchParams({ ...options, offset: (offset + limit).toString() }).toString();
  const prevPage = page + new URLSearchParams({ ...options, offset: (offset - limit).toString() }).toString();

  const response = await httpGet(`${resourceName}/page?${queryString}`);
  const data = (await response.json() as DataResult);

  if (data.items.length > 0) {
    if (!columns || columns.length === 0) {
      columns = Object.getOwnPropertyNames(data.items[0]).map((item) => {
        return {
          dataField: item,
        } as DataRowModel
      })
    }
    columns.forEach((col) => {
      if (col.headerText === undefined) col.headerText = String(col.dataField).charAt(0).toUpperCase() + String(col.dataField).slice(1);
      if (!col.dataFormatter) {
        col.dataFormatter = (item) => {
          return item[col.dataField];
        }
      }
      if (!col.headerClasses) {
        col.headerClasses = (index) => {
          return clsx(index === 0 ? "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-foreground sm:pl-0" : "px-3 py-3.5 text-left text-sm font-semibold text-foreground")
        }
      }
      if (!col.dataClasses) {
        col.dataClasses = (item, index) => {
          return clsx(index === 0 ?
            "py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-foreground sm:pl-0" :
            "px-3 py-4 text-sm whitespace-nowrap text-muted-foreground");
        }
      }
    })
  }

  const filterEntries = Object.entries(options).filter(([k, v]) =>
    !['offset', 'limit', 'issued', 'history', 'vehicleId[value]', 'vehicleId[text]', 'invoiceFrom', 'invoiceTo', 'month', 'year', 'desc'].includes(k) && v && v !== 'all'
  );

  return (

    <>

    {children}

    {filterEntries.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
        {filterEntries.map(([k, v]) => {
          const clearParams = new URLSearchParams(options);
          clearParams.delete(k);
          return (
            <Link
              key={k}
              href={`/home/${pageName}?${clearParams.toString()}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <span className="text-primary/70">{k.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}:</span>
              {v}
              <span className="text-primary/70 ml-0.5">×</span>
            </Link>
          );
        })}
      </div>
    )}

      <div className="-mx-4 sm:mx-0 mt-4 flow-root">
        {data.items.length===0?
         <EmptyState
           icon={<MagnifyingGlassIcon className="size-10" />}
           title="Nothing found"
           description="No matches here yet. Try a different search, or add a new one using the button above."
           action={emptyAction}
         />:
        <>
          {mobileCardFormatter && (
            <div className="md:hidden space-y-3 px-1 mb-4">
              {data.items.map((item) => (
                <div key={'card-' + item[idField]}>
                  {mobileCardFormatter(item)}
                </div>
              ))}
            </div>
          )}
          <div className={mobileCardFormatter ? 'hidden md:block' : ''}>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">

              <table className="min-w-full divide-y divide-border">
                <thead className="sticky top-0 bg-card z-10">
                  <tr>
                    {
                      columns?.map((val, index) => {
                        return <th key={'th' + index} className={val.headerClasses && val.headerClasses(index)}>{val.headerText}</th>
                      })
                    }
                    {editable && <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-0">
                      <span className="sr-only">Edit</span>
                    </th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((item, rowindex) => (
                    <tr key={'tr' + item[idField]}  className={clsx('hover:bg-secondary transition-colors even:bg-secondary/40', rowClass && rowClass(item))}>
                      {
                        columns?.map((col, colindex) => {
                          return <td key={'td' + colindex + item[idField] + rowindex}
                            className={col.dataClasses && col.dataClasses(item, colindex)}>
                            {col.dataFormatter && col.dataFormatter(item, colindex)}
                          </td>
                        })
                      }
                      {editable && <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                        <Link href={`/home/${pageName}/edit/${item[idField]}`} className="text-primary hover:text-primary/80">
                          Edit
                        </Link>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between border-t border-border bg-card px-4 py-3 sm:px-6"
          >
            <div className="hidden sm:flex sm:items-center sm:gap-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{offset + 1}</span> to <span className="font-medium">{offset + data.items.length}</span>
              </p>
              {hasFilters && (
                <Link href={`/home/${pageName}`} className="text-xs font-medium text-primary hover:text-primary/80">
                  Clear filters
                </Link>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between sm:justify-end gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Show</span>
                {[30, 50, 100].map(n => {
                  const href = page + new URLSearchParams({ ...options, limit: n.toString(), offset: '0' }).toString();
                  return (
                    <Link key={n} href={href}
                      className={clsx(
                        n === limit ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary',
                        'px-2 py-0.5 rounded text-xs font-medium'
                      )}>
                      {n}
                    </Link>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Link href={prevPage}
                  className={
                    clsx(offset <= 0 ? "pointer-events-none text-muted-foreground" : "text-foreground", "relative inline-flex items-center rounded-md bg-card px-3 py-2 text-sm font-semibold ring-1 ring-border ring-inset hover:bg-secondary focus-visible:outline-offset-0")} >Previous</Link>
                <Link href={nextPage}
                  className={
                    clsx(!data.hasMore ? "pointer-events-none text-muted-foreground" : "text-foreground", "relative inline-flex items-center rounded-md bg-card px-3 py-2 text-sm font-semibold ring-1 ring-border ring-inset hover:bg-secondary focus-visible:outline-offset-0")}>Next</Link>
              </div>
            </div>
          </nav>
        </>
        }

      </div>

       </>

  )
}
