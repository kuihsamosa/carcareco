'use client'

import { useRouter } from 'next/navigation';
import PrimaryButton from '@/_components/PrimaryButton';
import SecondaryButton from '@/_components/SecondaryButton';
import { IWorkData, IMechanic } from '../model';
import FormLabel from '@/_components/FormLabel';
import { ClientsCombobox, VehiclesCombobox } from '../../_components/SearchCombobox';
import { useState } from 'react';
import FormSwitch from '@/_components/FormSwitch';
import { Field, Label } from '@headlessui/react';
import { query } from '@/_lib/client/query-api';
import { useUnsavedChanges } from '@/_lib/useUnsavedChanges';
import { IVehicleData } from '../../vehicles/model';
import FormInput from '@/_components/FormInput';
import Select from '@/_components/Select';
import clsx from 'clsx';
import WorkInputMechanics from './WorkInputMechanics';
import WorkAboutItems from './WorkAboutItems';
import PreventEnterSubmit from '@/_components/PreventEnterSubmit';


export default function WorkInput({
    work,
    mechanics,
}: {
    work?: IWorkData | undefined,
    mechanics: IMechanic[]
}) {



    const router = useRouter()

    const [isDirty, setIsDirty] = useState(false)
    useUnsavedChanges(isDirty)

    const [isOffer, setIsOffer] = useState(false);

    const [onlyClientVehicles, setOnlyClientVehicles] = useState(!work ? true : false);

    const [clientVehicles, setClientVehicles] = useState<IVehicleData[]>([]);
    const [selectedClientVehicleId, setSelectedClientVehicleId] = useState(work?.vehicleId ?? '');
    const [clientUndisclosed, setClientUndisclosed] = useState(!work ? false : !work.clientId);
    const [newClientMode, setNewClientMode] = useState(false);
    const populateClientVehicles = (clientId: string) => {
        query({
            url: 'vehicles/client/' + clientId,
            method: 'GET',
            onSuccess: (result: IVehicleData[]) => {
                if (result) {
                    setClientVehicles(result);
                }
                else {
                    console.log(result);
                    return [];
                }
            },
            onFailure: ({ url, status, text }) => {
                console.log(url);
                console.log(text);
                console.log(status);
            }
        });
    }

    return (
        <>
            <PreventEnterSubmit />
            <div className="space-y-12 ">
                <div className="border-b  border-gray-900/10 pb-12">

                    <div className="grid grid grid-flow-row grid-cols-1  gap-4">
                        {!work && <div>
                            <FormLabel name='startWith' label='Start with'></FormLabel>
                            <Field className="flex mt-2 items-center">
                                <FormSwitch
                                    name='isOffer'
                                    checked={isOffer}
                                    onChange={(value) => {
                                        setIsOffer(value);
                                        setIsDirty(true);
                                    }}></FormSwitch>

                                <Label as="span" className="ml-3 text-sm">
                                    Offer
                                </Label>
                            </Field>
                        </div>}

                        <div className=" ">
                            <FormLabel name='clientId' label='Client'>
                                <span className="ml-4 float-right text-gray-500">
                                    Undisclosed{' '}
                                    <FormSwitch
                                        name='clientUndisclosed'
                                        small={true}
                                        checked={clientUndisclosed}
                                        onChange={(value) => {
                                            setClientUndisclosed(value);
                                            setOnlyClientVehicles(!value);
                                            setNewClientMode(false);
                                            setIsDirty(true);
                                        }}></FormSwitch>
                                </span>
                            </FormLabel>
                            {!clientUndisclosed && !newClientMode &&
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <ClientsCombobox name='clientId'
                                            onItemChange={(item) => {
                                                if (item) {
                                                    populateClientVehicles(item.value);
                                                    setOnlyClientVehicles(true);
                                                }
                                                setSelectedClientVehicleId('');
                                            }}
                                            defaultValue={{
                                                text: work?.clientName ?? '',
                                                value: work?.clientId ?? '',
                                            }}>
                                        </ClientsCombobox>
                                    </div>
                                    {!work && (
                                        <button type="button" onClick={() => { setNewClientMode(true); setIsDirty(true); }}
                                            className="mt-0 text-sm text-indigo-600 hover:text-indigo-500 whitespace-nowrap">
                                            + New
                                        </button>
                                    )}
                                </div>}
                            {!clientUndisclosed && newClientMode && (
                                <div className="mt-2 space-y-2 rounded-xl border border-gray-200 p-3 bg-gray-50">
                                    <input type="hidden" name="newClientMode" value="on" />
                                    <div className="flex gap-2">
                                        <FormInput placeholder="First name" name="newClientFirstName" className="flex-1" />
                                        <FormInput placeholder="Last name" name="newClientLastName" className="flex-1" />
                                    </div>
                                    <FormInput type="tel" inputMode="tel" placeholder="Phone" name="newClientPhone" />
                                    <button type="button" onClick={() => setNewClientMode(false)}
                                        className="text-xs text-gray-400 hover:text-gray-600">
                                        Cancel — use existing client
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className='  ' >
                            <FormLabel name='vehicleId' label='Vehicle'>
                                {!clientUndisclosed && <span className="ml-2 float-right text-gray-500">
                                    Search all vehicles{' '}
                                    <FormSwitch
                                        name='onlyClientVehicles'
                                        small={true}
                                        checked={!onlyClientVehicles}
                                        onChange={(value) => {
                                            setOnlyClientVehicles(!value);
                                        }}></FormSwitch>{' '}
                                </span>}

                            </FormLabel>
                            <div className='flex'>

                                <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                                    <div className= {clsx(onlyClientVehicles&&"mt-2", " sm:col-span-2   grid grid-cols-1")}> 
                                        {onlyClientVehicles ?
                                            <Select
                                                name='vehicleId'
                                                value={selectedClientVehicleId}
                                                onChange={(e) => {
                                                    setSelectedClientVehicleId(e.currentTarget.value);
                                                    setIsDirty(true);
                                                }} >
                                                <option value=''>
                                                    {clientVehicles.length === 0 ? '— select a customer first —' : '— select a vehicle —'}
                                                </option>
                                                {clientVehicles?.map((item, index) => {
                                                    return (<option key={index} value={item.id}>{[item?.producer, item?.model].filter(x => x).join(' ') + (!item?.regNr ? '' : ` (${item.regNr})`)}</option>)
                                                })}
                                            </Select> :
                                            <VehiclesCombobox name='vehicleId'

                                                defaultValue={{
                                                    text: [work?.vehicleProducer, work?.vehicleModel].filter(x => x).join(' ') + (!work?.vehicleRegNr ? '' : `(${work?.vehicleRegNr})`),
                                                    value: work?.vehicleId ?? '',
                                                }}>
                                            </VehiclesCombobox>}
                                    </div>
                                </div>
                                <div className='ml-2  '>
                                    <FormInput type='number' inputMode='numeric' placeholder='Odometer value' name='odo' defaultValue={work?.odo ?? 0}></FormInput>
                                </div>
                            </div>

                        </div>
                       <WorkInputMechanics mechanics={mechanics} work={work}></WorkInputMechanics>
                        <div className=" ">
                            <WorkAboutItems defaultValue={work?.notes} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-x-6">
                <SecondaryButton onClick={() => router.back()}>Cancel</SecondaryButton>
                <PrimaryButton onClick={() => { }}>Save</PrimaryButton>
            </div>
        </>
    )
}
