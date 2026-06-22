'use server'

import { DescriptionItem } from '@/_components/DescriptionItem';
import { httpGet } from '@/_lib/server/query-api'
import Main from '../../_components/Main';
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import { IVehicleData } from '../model';
import { CardHeader } from '@/_components/Card';
import EntityTabs from '@/_components/EntityTabs';
import { redirect } from 'next/navigation';



export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const id = (await params).id;
    redirect(`/home/vehicles/${id}/services`);
    const data = await httpGet('vehicles/' + id);
    const vehicle = await data.json() as IVehicleData;
  
    return (

        <Main narrow={false} header={
            <CardHeader  >
                 <h3 className="px-1 text-base font-semibold text-gray-900">Vehicle Information</h3>
                <DisplayOptionsMenu id={id} pageName='vehicles'></DisplayOptionsMenu>
            </CardHeader>}>
            <EntityTabs basePath={`/home/vehicles/${id}`} />
            <dl className="divide-y divide-gray-100"> 
                <DescriptionItem label='Car make and model' value={[vehicle.producer, vehicle.model].join(' ')}></DescriptionItem>
                <DescriptionItem label='VIN' value={vehicle.vin}></DescriptionItem>
                <DescriptionItem label='Registration number' value={vehicle.regNr}></DescriptionItem>
                <DescriptionItem label='Odometer' value={vehicle.odo}></DescriptionItem>
                <DescriptionItem label='Owner' value={vehicle.ownerName}></DescriptionItem>
                <DescriptionItem label='About' value={vehicle.description}></DescriptionItem>
            </dl>
        </Main>
    )

}