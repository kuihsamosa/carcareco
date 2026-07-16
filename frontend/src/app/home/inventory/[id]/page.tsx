'use server'

import { DescriptionItem } from '@/_components/DescriptionItem';
import { httpGet } from '@/_lib/server/query-api'
import Main from '../../_components/Main';
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import { ISparepartData } from '../model';
import { CardHeader } from '@/_components/Card';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
 

 
export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>
}) { 
    const id = (await params).id;
    const data = await httpGet('spareparts/' + id);
    const sparepart = await data.json() as ISparepartData; 
 
    return (

        <Main header={
            <CardHeader>
                    <nav className="flex items-center gap-1 text-sm text-gray-400 mb-2 px-1 lg:px-0">
                        <Link href="/home/inventory" className="hover:text-gray-600 transition-colors">Inventory</Link>
                        <ChevronRightIcon className="size-4" />
                        <span className="text-gray-700 font-medium">{sparepart.code || sparepart.name}</span>
                    </nav>
                    <h3 className="px-1 text-base font-semibold text-gray-900">Spare part information</h3>
                    <DisplayOptionsMenu id={id} pageName='inventory'></DisplayOptionsMenu>
            </CardHeader>}>  
            <dl className="divide-y divide-gray-100">
                    <DescriptionItem label='Product code' value={sparepart.code}></DescriptionItem> 
                    <DescriptionItem label='Product name' value={sparepart.name}></DescriptionItem>   
                    <DescriptionItem label='Quantity' value={sparepart.quantity}></DescriptionItem>  
                    <DescriptionItem label='Price' value={sparepart.price}></DescriptionItem> 
                    <DescriptionItem label='Location' value={sparepart.storageName}></DescriptionItem> 
                    <DescriptionItem label='About' value={sparepart.description}></DescriptionItem> 
                </dl>
        </Main>
    )
  
}