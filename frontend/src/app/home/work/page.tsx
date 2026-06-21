import Search from "../_components/Search";
import moment from "moment";
import { IOfferIssuance, IWorkIssuance } from "./model";
import PricingDownloadLink from "./_components/activity/PricingDownloadLink";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import Spinner from "@/_components/Spinner";
import BlueBadge from "@/_components/BlueBadge";
import WorkStatusBadge from "./_components/activity/badges/WorkStatusBadge";
import { EmailSentBadge, OverdueBadge } from "./_components/activity/badges/IssuanceBadges";
import { SearchCardHeader } from "../_components/SearchCardHeader";
import { Card } from "@/_components/Card";
import SearchStatusFilter from "./_components/SearchStatusFilter";
import SearchParams from "./_components/SearchParams";
import PrimaryButton from "@/_components/PrimaryButton";
import SearchInput from "../_components/SearchInput";
import FormInput from "@/_components/FormInput";
import { UserCircleIcon, TruckIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

function MechanicChip({ name }: { name: string }) {
  const colors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-rose-500','bg-amber-500','bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[9px] font-bold ${color}`} title={name}>
      {initials}
    </span>
  );
}

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string>> }) {

  const options = (await searchParams);

  const isInvoiceView = options.issued == 'on';

  const secondColumn = isInvoiceView ? {
    dataField: 'issuance',
    headerText: 'Invoice',

    dataFormatter: ({ issuance, id }: { issuance: IWorkIssuance, id: string }) => {
      return (
        issuance ?
          <div className="flex gap-x-2 ">
            <div>  <PricingDownloadLink
              name='Invoice'
              id={id}
              number={issuance.invoiceNumber}
              downloadingElement={<Spinner></Spinner>}
              hidePaperClip={true}
              clickableElement={<ArrowDownTrayIcon aria-hidden="true" className="h-6 w-5 text-gray-400" ></ArrowDownTrayIcon>} >
            </PricingDownloadLink> </div>
            <div>
              <EmailSentBadge issueance={issuance}></EmailSentBadge>
              <OverdueBadge issueance={issuance}></OverdueBadge></div>
          </div> :
          <></>
      );
    }
  } : {
    dataField: 'offerissuance',
    headerText: 'Repair, Offer',

    dataFormatter: ({ offerIssuance, hasRepairs, numberOfOffers }: { hasRepairs: boolean, offerIssuance: IOfferIssuance, numberOfOffers: number }) => {

      return (
        <div className="flex gap-x-2">
          {hasRepairs && <BlueBadge text="Repair job"></BlueBadge>}
          {numberOfOffers > 1 ?
            <BlueBadge text="Many offers"></BlueBadge> :
            <>
              {offerIssuance &&
                <>
                  <div>  <PricingDownloadLink
                    name='Offer'
                    id={offerIssuance.id}
                    number={offerIssuance.number}
                    downloadingElement={<Spinner></Spinner>}
                    hidePaperClip={true}
                    hideLabel={false}
                    clickableElement={<ArrowDownTrayIcon aria-hidden="true" className="h-6 w-5 text-gray-400" ></ArrowDownTrayIcon>} >
                  </PricingDownloadLink> </div>
                  <div> <h5><EmailSentBadge issueance={offerIssuance}></EmailSentBadge></h5></div>
                </>
              }
            </>
          }</div>

      );
    }
  };

  const columns = [
    {
      dataField: 'workNr',
      headerText: 'Work',

      dataFormatter: ({ id, workNr, status }: { id: string, status: string, workNr: string }) => {

        return (
          <a href={'/home/work/' + id}>
            <h5 >Work nr. {workNr}
              {' '} {!isInvoiceView && <WorkStatusBadge status={status} ></WorkStatusBadge>}
            </h5>
          </a>
        );
      }
    },
    secondColumn,
    {
      dataField: 'startedOn',
      headerText: 'Started on',//  {moment(activity?.startedOn, true).format('LLL')}
      dataFormatter: ({ startedOn }: { startedOn: Date }) => {
        return (
          moment(startedOn, true).format('LL')
        );
      }
    },

    {
      dataField: 'clientId',
      headerText: 'Client',
      dataFormatter: ({ clientName, clientId }: { clientName: string, clientId: string }) => {
        return (
          <a href={'/home/clients/' + clientId} >
            <h5 >{clientName}</h5>
          </a>
        );
      }
    },
    {
      dataField: 'vehicleId',
      headerText: 'Vehicle',
      dataFormatter: ({ regNr, vehicleId }: { regNr: string, vehicleId: string }) => {
        return (
          <a href={'/home/vehicles/' + vehicleId} >
            <h5 className="mb-0 fs--1">{regNr}</h5>
          </a>
        );
      }
    },

    {
      dataField: 'mechanicNames',
      headerText: 'Mechanics',
    },
    {
      dataField: 'notes',
      headerText: 'Description',
      dataFormatter: ({ notes }: { notes: string }) => {
        return (
          <p title={notes} className="truncate max-w-[140px] sm:max-w-xs" style={{ marginBottom: "-5px" }} >
            {notes}
          </p>
        );
      }
    }
  ]


  return <main className=" lg:pl-62   ">
    <form method="GET" >
      <div className=" sm:py-6 px-4 sm:px-8   sm:gap-4">


        <div className="">

          <Card header={
            
            <SearchCardHeader title="Find Work" pageName="work">
            </SearchCardHeader>}  >

            <Search
              searchParams={searchParams}
              resourceName="work"
              idField="id"
              rowClass={(item) => {
                return (item['status'] === 'closed' ? 'line-through' : '')
              }}
              columns={columns}
              mobileCardFormatter={(item) => (
                <a
                  href={`/home/work/${item.id}`}
                  className={`block bg-white border rounded-2xl p-4 shadow-sm active:bg-gray-50 transition-colors ${item.status === 'closed' ? 'opacity-60' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Work #{item.workNr ?? item.number}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{moment(item.startedOn).format('ll')}</div>
                    </div>
                    <WorkStatusBadge status={item.status} />
                  </div>

                  {item.vehicleRegNr && (
                    <div className="flex items-center gap-2 mb-2">
                      <TruckIcon className="size-3.5 text-gray-400 shrink-0" />
                      <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[11px] px-2 py-0.5 rounded uppercase tracking-wider">
                        {item.vehicleRegNr}
                      </span>
                      {(item.vehicleProducer || item.vehicleModel) && (
                        <span className="text-[11px] text-gray-500 truncate">{item.vehicleProducer} {item.vehicleModel}</span>
                      )}
                    </div>
                  )}

                  {item.clientName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                      <UserCircleIcon className="size-3.5 shrink-0" />
                      {item.clientName}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-gray-400 truncate mt-1">{item.notes}</p>
                  )}

                  {item.mechanicNames && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {String(item.mechanicNames).split(',').filter(Boolean).map((name: string, i: number) => (
                        <MechanicChip key={i} name={name.trim()} />
                      ))}
                    </div>
                  )}

                  {item.issuance && (
                    <div className="mt-2 flex items-center gap-1">
                      <DocumentTextIcon className="size-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Invoice #{(item.issuance as IWorkIssuance).invoiceNumber}</span>
                    </div>
                  )}
                </a>
              )}
            >
              {/* Plate-number search shortcut — mobile prominent */}
              <div className="mb-3 md:hidden">
                <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wide">🔍 Search by plate or client</label>
                <SearchInput searchParams={searchParams} placeholder="AB 123 CD · client name · VIN…" />
              </div>

              <div className=" 3xl:flex">
                 <div className="  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 md:grid-flow-row md:gap-x-2 3xl:grid-flow-col  3xl:grid-cols-24   p-0 3xl:gap-x-2  gap-y-2  ">
                      <div className="sm:col-span-2 3xl:col-span-6 md:col-span-7 "   >
                        <SearchStatusFilter issued={options.issued === 'on'} status={options.status}></SearchStatusFilter>
                        <SearchInput searchParams={searchParams} placeholder="number, client, vehicle vin or reg nr." ></SearchInput>
                      </div>
                      <div className="3xl:col-span-4  md:col-span-5 ">
                         <FormInput name="saleable" label="Product or service" placeholder="code or name ..." defaultValue={options.saleable}  ></FormInput>
                      </div>
                      <div  className="3xl:col-span-14  md:col-span-12  " >
                      <SearchParams options={options}></SearchParams>
                      </div>

                  </div>
                  <div className="mx-2 text-right mt-8">
                        <PrimaryButton   id="btnSubmit">Search</PrimaryButton>
                   </div>
              </div>

            </Search>
          </Card>

        </div>
      </div>
    </form>
  </main>
}