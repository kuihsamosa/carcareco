'use server'

import { DescriptionItem } from '@/_components/DescriptionItem';
import { httpGet } from '@/_lib/server/query-api';
import moment from 'moment';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import Main from '../../_components/Main';
import DisplayOptionsMenu from '@/_components/DisplayOptionsMenu';
import FormList from '@/_components/FormList';
import FormListEmailItem from '../_components/FormListEmailItem';
import { IClientData } from '../model';
import BlueBadge from '@/_components/BlueBadge';
import YellowBadge from '@/_components/YellowBadge';
import { CardHeader } from '@/_components/Card';
import EntityTabs from '@/_components/EntityTabs';
import CopyButton from '@/_components/CopyButton';


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
              <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2 px-1 lg:px-0">
                  <Link href="/home/clients" className="hover:text-muted-foreground transition-colors">Clients</Link>
                  <ChevronRightIcon className="size-4" />
                  <span className="text-foreground font-medium">{client.isPrivate ? [client.firstName, client.lastName].filter(Boolean).join(' ') : client.name}</span>
              </nav>
              <h3 className="px-1 lg:px-0 text-base font-semibold text-foreground">Client Information{' '}
                        <BlueBadge text={!client.isPrivate ? ' Company' : ' Private person'}  ></BlueBadge>{' '}
                        {client.isAsshole && <YellowBadge text='complicated' ></YellowBadge>}</h3> 
          
                <DisplayOptionsMenu id={id} pageName='clients'></DisplayOptionsMenu>
        </CardHeader>}>
                    <EntityTabs basePath={`/home/clients/${id}`} />
                    <div className="  border-border">
                        <dl className="divide-y divide-border">

                            {!client.isPrivate ?
                                <DescriptionItem label='Company name' value={client.name}></DescriptionItem>
                                : <DescriptionItem label='Full name' value={client.firstName + ' ' + client.lastName}></DescriptionItem>}
                            <DescriptionItem label='Phone' value={client.phone ? <span className="inline-flex items-center"><a href={`tel:${client.phone}`} className="text-primary hover:text-primary/80">{client.phone}</a><CopyButton text={client.phone} /></span> : null}></DescriptionItem>
                            {(client.emailAddresses?.length ?? 0) < 2 ?
                                <DescriptionItem label='Email address' value={client.currentEmail ? <span className="inline-flex items-center"><a href={`mailto:${client.currentEmail}`} className="text-primary hover:text-primary/80">{client.currentEmail}</a><CopyButton text={client.currentEmail} /></span> : null}></DescriptionItem>
                                : <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                                    <dt className="text-sm/6 font-medium text-foreground">Email addresses</dt>
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
                            <DescriptionItem label='Added' value={client.introducedAt ? moment(client.introducedAt).format('LL') : null}></DescriptionItem>
                        </dl>
                    </div>

                    {vehicles.length > 0 && (
                        <div className="mt-6">
                            <h4 className="px-4 sm:px-0 text-sm font-semibold text-foreground mb-2">Vehicles</h4>
                            <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                                {vehicles.map(v => (
                                    <li key={v.id}>
                                        <Link href={`/home/vehicles/${v.id}/services`} className="flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors">
                                            <span className="text-sm font-medium text-foreground">
                                                {[v.producer, v.model].filter(Boolean).join(' ')}
                                                {v.regNr && <span className="ml-2 text-muted-foreground">({v.regNr})</span>}
                                            </span>
                                            {v.vin && <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{v.vin}</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

        </Main>
    )
}