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
    //if no columns defined show all what data has
    if (!columns || columns.length === 0) {
      columns = Object.getOwnPropertyNames(data.items[0]).map((item) => {
        return {
          dataField: item,
        } as DataRowModel
      })
    }
    //populate defaults
    columns.forEach((col) => {
      if (col.headerText === undefined) col.headerText = String(col.dataField).charAt(0).toUpperCase() + String(col.dataField).slice(1);
      if (!col.dataFormatter) {
        col.dataFormatter = (item) => {
          return item[col.dataField];
        }
      }
      if (!col.headerClasses) {
        col.headerClasses = (index) => {
          return clsx(index === 0 ? "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0" : "px-3 py-3.5 text-left text-sm font-semibold text-gray-900")
        }
      }
      if (!col.dataClasses) {
        col.dataClasses = (item, index) => {
          return clsx(index === 0 ?
            "py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0" :
            "px-3 py-4 text-sm whitespace-nowrap text-gray-500");
        }
      }
    })
  }

  const filterEntries = Object.entries(options).filter(([k, v]) =>
    !['offset', 'limit', 'issued', 'history', 'vehicleId[value]', 'vehicleId[text]'].includes(k) && v && v !== 'all'
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
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <span className="text-indigo-400">{k.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}:</span>
              {v}
              <span className="text-indigo-400 ml-0.5">×</span>
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
         />:
        <>
          {/* Mobile card view — shown when mobileCardFormatter is provided */}
          {mobileCardFormatter && (
            <div className="md:hidden space-y-3 px-1 mb-4">
              {data.items.map((item) => (
                <div key={'card-' + item[idField]}>
                  {mobileCardFormatter(item)}
                </div>
              ))}
            </div>
          )}
          {/* Desktop table view */}
          <div className={mobileCardFormatter ? 'hidden md:block' : ''}>
          <div className="overflow-x-auto">
          <div className=" overflow-x-auto  ">
            <div className="inline-block min-w-full   align-middle  ">

              <table className="min-w-full divide-y divide-gray-300">
                <thead className="sticky top-0 bg-white z-10">
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
                <tbody className="divide-y divide-gray-200">
                  {data.items.map((item, rowindex) => (
                    <tr key={'tr' + item[idField]}  className={clsx('hover:bg-gray-50 transition-colors', rowClass && rowClass(item))}>
                      {
                        columns?.map((col, colindex) => {
                          return <td key={'td' + colindex + item[idField] + rowindex}
                            className={col.dataClasses && col.dataClasses(item, colindex)}>
                            {col.dataFormatter && col.dataFormatter(item, colindex)}
                          </td>
                        })
                      }
                      {editable && <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                        <Link href={`/home/${pageName}/edit/${item[idField]}`} className="text-indigo-900 hover:text-indigo-500">
                          Edit
                        </Link>
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
          >
            <div className="hidden sm:flex sm:items-center sm:gap-4">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{offset + 1}</span> to <span className="font-medium">{offset + data.items.length}</span>
              </p>
              {hasFilters && (
                <Link href={`/home/${pageName}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  Clear filters
                </Link>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between sm:justify-end gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
                <span>Show</span>
                {[30, 50, 100].map(n => {
                  const href = page + new URLSearchParams({ ...options, limit: n.toString(), offset: '0' }).toString();
                  return (
                    <Link key={n} href={href}
                      className={clsx(
                        n === limit ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-100',
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
                    clsx(offset <= 0 ? "pointer-events-none text-gray-400" : "text-gray-900", "relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0")} >Previous</Link>
                <Link href={nextPage}
                  className={
                    clsx(!data.hasMore ? "pointer-events-none text-gray-400" : "text-gray-900", "relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0")}>Next</Link>
              </div>
            </div>
          </nav>
        </div>
        </div>
        </>
        }

      </div>
      
       </>

  )
}