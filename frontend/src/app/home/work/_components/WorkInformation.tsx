

'use client'
import { IWorkData } from '../model';
import { DocumentTextIcon, TruckIcon, UserCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/20/solid';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import { query } from '@/_lib/client/query-api';
import { startAnActivity } from '../actions/startAnActivity';
import ButtonGroup, { IButtonOption } from '@/_components/ButtonGroup';
import HamburgerMenu from '@/_components/HamburgerMenu';
import { BaseDialogHandle } from '@/_components/BaseDialog';
import IssueInvoiceDialog from './activity/IssueInvoiceDialog';
import DeleteInvoiceDialog from './activity/DeleteInvoiceDialog';
import PricingDownloadLink from './activity/PricingDownloadLink';
import WorkStatusBadge from './activity/badges/WorkStatusBadge';
import { IssuanceBadges } from './activity/badges/IssuanceBadges';
import { togglePaid } from '../actions/togglePaid';
import SendPricingDialog from './activity/SendPricingDialog';
import { deleteWork } from '../actions/deleteAnActivity';
import ConfirmDialog, { ConfirmDialogHandle } from '@/_components/ConfirmDialog';
import { createACopy } from '../actions/createACopy';
import FormSwitch from '@/_components/FormSwitch';
import { Dialog, DialogBackdrop, DialogPanel, Field, Label } from '@headlessui/react';
import { changeWorkStatus } from '../actions/changeWorkStatus';

function MechanicAvatar({ name }: { name: string }) {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
        <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${color} ring-2 ring-white`}
            title={name}
        >
            {initials}
        </span>
    );
}

const statusOptions = [
    { key: 'Default',    label: '🔵 Open',        desc: 'Reset to open / pending',          bg: 'bg-gray-50 hover:bg-gray-100 text-gray-800' },
    { key: 'InProgress', label: '🟢 In Progress',  desc: 'Mark as actively being worked on', bg: 'bg-green-50 hover:bg-green-100 text-green-900' },
    { key: 'Closed',     label: '🟡 Closed',       desc: 'Mark as finished / closed',        bg: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900' },
] as const;


export function WorkInformation({
    work,
    hasRepairJobWithProductsOrServices,
}: {
    work: IWorkData,
    hasRepairJobWithProductsOrServices: boolean
}) {

    const editPath = '/home/work/edit/' + work.id;

    const vehicleSummary = [work.vehicleProducer, work.vehicleModel, work.vehicleVin, work.vehicleRegNr].filter(x => x).join(', ');
    const clientSummary = [work.clientName, work.clientPhone, work.clientEmail].filter(x => x).join(', ');

    const [startedOn, setStartedOn] = useState<Date | string>(work.startedOn);
    const [editingDate, setEditingDate] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const newDate = e.currentTarget.value;
        if (!newDate) { setEditingDate(false); return; }
        query({
            url: `work/${work.id}/startedon`,
            method: 'PUT',
            body: newDate,
            onSuccess: () => { setStartedOn(new Date(newDate).toISOString()); },
            onFailure: () => {},
        });
        setEditingDate(false);
    };

    const [statusSheetOpen, setStatusSheetOpen] = useState(false);
    const deleteInvoiceRef = React.useRef<BaseDialogHandle>(null);
    const createInvoiceRef = React.useRef<BaseDialogHandle>(null);
    const sendInvoiceRef = React.useRef<BaseDialogHandle>(null);
    const deleteWorkRef = React.useRef<ConfirmDialogHandle>(null);
    
    const workMenuOptions = work.issuance ? [] : [
        { name: 'Make an offer', onClick: async () => { await startAnActivity(work.id, "offer") } },
        { name: 'Start repair job', onClick: async () => { await startAnActivity(work.id, "repairjob") } },
        { name: 'Edit', href: editPath },
        { name: 'Delete', redText:true, onClick:   () => { deleteWorkRef.current?.open({
            title:'Delete work',description:'Are you sure you want to delete it?',confirmObj:work.id
        })  } },
    ] as IButtonOption[];
   
    workMenuOptions.push({ name: 'Create a copy', onClick: async () => { await createACopy(work.id) } })
        ;

    const issuedButtonOptions = !work.issuance? []: [
        {
            name: 'Delete invoice',
            isPrimary:false,
            redText:true,
            inMenu:true,
            onClick:() => { deleteInvoiceRef.current?.open() }
        },
        {
            name: (work.issuance.isPaid?'Unpaid':'Payment received'),
            isPrimary:!work.issuance.isPaid,
            onClick:async () => { await togglePaid(work.id,!work.issuance.isPaid) }
        } , {
            name: 'Send invoice',
            isPrimary:false,
            onClick:() => { sendInvoiceRef.current?.open() }
        },
    ] as IButtonOption[];

    const editButtonOptions = []  as IButtonOption[];

    if(!work.issuance){

      
        if(work.status!=='closed'){
            editButtonOptions.push({ 
                name: 'Close',
                onClick: async() => { 
                    await changeWorkStatus(work.id,'Closed');
                }, 
             });
        }
        else if(work.status==='closed'){
            editButtonOptions.push({ 
                name: 'Open',
                isPrimary: true,
                onClick: async() => { 
                    await changeWorkStatus(work.id,'Default');
                }, 
             });
        }

        if(hasRepairJobWithProductsOrServices && work.status!=='closed' ){
            editButtonOptions.push({
                name: 'Issue invoice',
                onClick:() => { createInvoiceRef.current?.open() },
                isPrimary:true 
            });
        }
       
    }
    
    return (
        <>
            <IssueInvoiceDialog work={work} dialogRef={createInvoiceRef}></IssueInvoiceDialog>
            <DeleteInvoiceDialog work={work} dialogRef={deleteInvoiceRef}></DeleteInvoiceDialog>
            <SendPricingDialog work={work} dialogRef={sendInvoiceRef}></SendPricingDialog>
            <ConfirmDialog ref={deleteWorkRef} onConfirm={async () => {
                await deleteWork(work.id);
            }} ></ConfirmDialog>

            {/* Status tap bottom sheet (mobile) */}
            {!work.issuance && (
                <Dialog open={statusSheetOpen} onClose={() => setStatusSheetOpen(false)} className="relative z-50">
                    <DialogBackdrop className="fixed inset-0 bg-black/30" />
                    <div className="fixed inset-0 flex items-end justify-center pointer-events-none">
                        <DialogPanel className="pointer-events-auto w-full max-w-sm bg-white rounded-t-2xl px-5 py-6 space-y-3 shadow-xl">
                            <h3 className="font-semibold text-gray-900 text-base mb-1">Change Status</h3>
                            {statusOptions.map(opt => {
                                const currentKey = work.status === 'inprogress' ? 'InProgress' : work.status === 'closed' ? 'Closed' : 'Default';
                                const isCurrent = opt.key === currentKey;
                                return (
                                    <button
                                        key={opt.key}
                                        disabled={isCurrent}
                                        onClick={async () => {
                                            await changeWorkStatus(work.id, opt.key);
                                            setStatusSheetOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${opt.bg} disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        <div className="font-semibold text-sm">{opt.label}{isCurrent && ' ✓'}</div>
                                        <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setStatusSheetOpen(false)}
                                className="w-full text-center text-sm text-gray-400 py-2"
                            >
                                Cancel
                            </button>
                        </DialogPanel>
                    </div>
                </Dialog>
            )}

            <div className="lg:col-start-3 lg:row-end-1">
                <h2 className="sr-only">Summary</h2>
                <dl className="flex flex-wrap">
                    <div className="flex-auto xl:pt-6 xl:pl-6">
                        <dt className="text-base font-semibold text-gray-900 mr-2 flex items-center gap-2 flex-wrap">
                            Work nr {work.number}
                            {/* Tap badge to change status on mobile */}
                            {!work.issuance ? (
                                <button
                                    type="button"
                                    onClick={() => setStatusSheetOpen(true)}
                                    title="Tap to change status"
                                    className="cursor-pointer"
                                >
                                    <WorkStatusBadge status={work.status} />
                                </button>
                            ) : (
                                <WorkStatusBadge status={work.status} />
                            )}
                        </dt>
                        <dd className="text-sm/6 text-gray-500">
                            {editingDate ? (
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    autoFocus
                                    defaultValue={moment(startedOn).format('YYYY-MM-DD')}
                                    onBlur={handleDateBlur}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingDate(false); if (e.key === 'Enter') e.currentTarget.blur(); }}
                                    className="text-sm border border-gray-300 rounded px-1 py-0.5"
                                />
                            ) : (
                                <time dateTime={startedOn?.toString()} onClick={() => !work.issuance && setEditingDate(true)}
                                    className={!work.issuance ? 'cursor-pointer hover:text-gray-700 hover:underline decoration-dashed underline-offset-2' : ''}>
                                    {moment(startedOn).format('LLL')}
                                </time>
                            )}
                        </dd>
                    </div>

                    <div className="flex-none col-span-2 self-end px-2 xl:px-6 pt-4">
                        <dt className="sr-only"></dt>
                        <dd className="inline-flex">
                            <HamburgerMenu options={workMenuOptions}></HamburgerMenu>
                        </dd>
                    </div>
                    <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6"></div>
                    {clientSummary &&
                        <div className="mt-4 flex w-full flex-none gap-x-4 xl:px-6">
                            <dt className="flex-none">
                                <span className="sr-only">Client</span>
                                <UserCircleIcon aria-hidden="true" className="h-6 w-5 text-gray-400" />
                            </dt>
                            <dd className="text-sm/6 font-medium text-gray-900">
                                <span>{clientSummary}</span>
                            </dd>
                        </div>
                    }

                    {vehicleSummary && <div className="mt-4 flex w-full flex-none gap-x-4 xl:px-6">
                        <dt className="flex-none">
                            <TruckIcon aria-hidden="true" className="h-6 w-5 text-gray-400" />
                        </dt>
                        <dd className="text-sm/6 text-gray-500">
                            <time dateTime="2023-01-31">{vehicleSummary}</time>
                        </dd>
                    </div>}

                    {/* Mechanic avatar chips */}
                    {work.mechanics?.length > 0 &&
                        <div className="mt-4 flex w-full flex-none gap-x-4 xl:px-6">
                            <dt className="flex-none">
                                <span className="sr-only">Mechanics</span>
                                <WrenchScrewdriverIcon aria-hidden="true" className="h-6 w-5 text-gray-400 mt-1" />
                            </dt>
                            <dd className="flex flex-wrap gap-2 items-center">
                                {work.mechanics.map((m) => (
                                    <span key={m.id} className="flex items-center gap-1.5">
                                        <MechanicAvatar name={m.name} />
                                        <span className="text-sm/6 text-gray-500">{m.name}</span>
                                    </span>
                                ))}
                            </dd>
                        </div>
                    }
                    {work.notes && <div className="mt-4 flex w-full flex-none gap-x-4 xl:px-6">
                        <dt className="flex-none">
                            <span className="sr-only">Notes</span>
                            <DocumentTextIcon aria-hidden="true" className="h-6 w-5 text-gray-400" />
                        </dt>
                        <dd className="text-sm/6 text-gray-500 whitespace-pre-line">{work.notes}</dd>
                    </div>}
                    <div className="mt-6 flex gap-x-2 xl:px-6   ">  
                        {work.issuance && <>
                            
                        <PricingDownloadLink name='Invoice' id={work.id} hidePaperClip={false} number={work.issuance.invoiceNumber}></PricingDownloadLink>
                        <IssuanceBadges issueance={work.issuance}   ></IssuanceBadges></> } 
                    </div>

                    <div className="mt-6 flex w-full xl:px-6 ">
                        <dt className=" flex-auto">
                       {!work.issuance && work.status!=='closed'&&<Field className="flex mt-1 items-center"> 
                            <FormSwitch 
                               name='inprogress' 
                               defaultChecked={work.status === 'inprogress'} 
                               onChange={async (val)=>{
                                   const status = val? 'InProgress':'Default';
                                    await changeWorkStatus(work.id,status);
                               }}
                               >
                               </FormSwitch>
                            <Label as="span" className="ml-3 text-sm"> 
                                <span className="text-gray-500">Is in progress</span>
                            </Label>
                            </Field> } 
                        </dt>
                        <dd>
                            
                            {work.issuance ?
                                <ButtonGroup options={issuedButtonOptions}></ButtonGroup>:
                                <ButtonGroup options={editButtonOptions}></ButtonGroup>
                                }
                        </dd>
                    </div>

                </dl>

            </div>
        </>

    )
}