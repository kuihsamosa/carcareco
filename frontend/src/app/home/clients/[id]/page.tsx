'use server'

import { DescriptionItem } from '@/_components/DescriptionItem';
import { httpGet } from '@/_lib/server/query-api'
import Main from '../../_components/Main';
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import FormList from '@/_components/FormList';
import FormListEmailItem from '../_components/FormListEmailItem';
import { IClientData } from '../model';
import BlueBadge from '@/_components/BlueBadge';
import YellowBadge from '@/_components/YellowBadge';
import { CardHeader } from '@/_components/Card';
import EntityTabs from '@/_components/EntityTabs';


interface IClientVehicle {
    id: string;
    producer: string;
    model: string;
    regNr: string;
    vin: string;
}

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const id = (await params).id;
    const [data, vehiclesData] = await Promise.all([
        httpGet('clients/' + id),
        httpGet('vehicles/client/' + id),
    ]);
    const client = await data.json() as IClientData;
    const vehicles = await vehiclesData.json() as IClientVehicle[];
    return (

        <Main narrow={false} header={
        <CardHeader  >
              <h3 className="px-1 lg:px-0 text-base font-semibold text-gray-900">Client Information{' '}
                        <BlueBadge text={!client.isPrivate ? ' Company' : ' Private person'}  ></BlueBadge>{' '}
                        {client.isAsshole && <YellowBadge text='complicated' ></YellowBadge>}</h3> 
          
                <DisplayOptionsMenu id={id} pageName='clients'></DisplayOptionsMenu>
        </CardHeader>}>
                    <EntityTabs basePath={`/home/clients/${id}`} />
                    <div className="  border-gray-100">
                        <dl className="divide-y divide-gray-100">

                            {!client.isPrivate ?
                                <DescriptionItem label='Company name' value={client.name}></DescriptionItem>
                                : <DescriptionItem label='Full name' value={client.firstName + ' ' + client.lastName}></DescriptionItem>}
                            <DescriptionItem label='Phone' value={client.phone}></DescriptionItem>
                            {(client.emailAddresses?.length ?? 0) < 2 ?
                                <DescriptionItem label='Email address' value={client.currentEmail}></DescriptionItem>
                                : <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm/6 font-medium text-gray-900">Email addresses</dt>
                                    <FormList
                                        items={client.emailAddresses ?? []}
                                        renderItem={(item) => {
                                            return <FormListEmailItem mail={item} isPrimary={item === client.currentEmail}></FormListEmailItem>
                                        }}>
                                    </FormList>
                                </div>
                            }
                            {!client.isPrivate ?
                                <DescriptionItem label='Registry code' value={client.regNr}></DescriptionItem>
                                : <DescriptionItem label='Personal code' value={client.personalCode}></DescriptionItem>}

                            <DescriptionItem label='Address' value={[client.address?.country, client.address?.region, client.address?.city, client.address?.street, client.address?.postalCode].filter(item => item).join(', ')}></DescriptionItem>
                            <DescriptionItem label='About' value={client.description}></DescriptionItem>
                            <DescriptionItem label='Added' value={client.introducedAt}></DescriptionItem>
                        </dl>
                    </div>

                    {vehicles.length > 0 && (
                        <div className="mt-6">
                            <h4 className="px-4 sm:px-0 text-sm font-semibold text-gray-900 mb-2">Vehicles</h4>
                            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                {vehicles.map(v => (
                                    <li key={v.id}>
                                        <a href={`/home/vehicles/${v.id}/services`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                            <span className="text-sm font-medium text-gray-900">
                                                {[v.producer, v.model].filter(Boolean).join(' ')}
                                                {v.regNr && <span className="ml-2 text-gray-500">({v.regNr})</span>}
                                            </span>
                                            <span className="text-xs text-gray-400">{v.vin}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

        </Main>
    )
}