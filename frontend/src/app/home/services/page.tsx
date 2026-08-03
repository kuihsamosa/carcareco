import Search from "../_components/Search";
import Link from "next/link";
import { Card } from "@/_components/Card";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import SearchInput from "../_components/SearchInput";
import SearchButton from "@/_components/SearchButton";

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = await searchParams;
  const mergedParams = Promise.resolve({ ...options, history: 'on' });

  const columns = [
    {
      dataField: 'workNr',
      headerText: 'Work',
      dataFormatter: ({ id, workNr }: { id: string; workNr: string }) => (
        <Link href={'/home/work/' + id} className="text-primary hover:text-primary/80">
          {workNr}
        </Link>
      ),
    },
    {
      dataField: 'notes',
      headerText: 'Description',
      dataFormatter: ({ notes }: { notes: string }) => (
        <p title={notes} className="truncate max-w-xs">
          {notes || '—'}
        </p>
      ),
    },
  ];

  return (
    <main>
      <form method="GET">
        <input type="hidden" name="history" value="on" />
        <div className="sm:py-6 px-4 sm:px-8 sm:gap-4">
          <Card
            header={
              <SearchCardHeader title="Services" pageName="work">
              </SearchCardHeader>
            }
          >
            <Search
              searchParams={mergedParams}
              resourceName="work"
              pageName="services"
              idField="id"
              editable={false}
              columns={columns}
            >
              <div className="flex gap-x-2 mb-4 items-end">
                <div className="flex-1">
                  <SearchInput
                    searchParams={mergedParams}
                    placeholder="search by description"
                  />
                </div>
                <div className="mb-1">
                  <SearchButton id="btnSubmit">Search</SearchButton>
                </div>
              </div>
            </Search>
          </Card>
        </div>
      </form>
    </main>
  );
}
