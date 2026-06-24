'use server'

import { httpPut,httpPost } from "@/_lib/server/query-api";
import {  pushToast } from "@/_lib/server/pushToast";
import { redirect } from "next/navigation"; 

export async function createOrUpdate(
    formData: FormData
    ) {


    const id = formData.get('id');
    let vehicleId = formData.get('vehicleId');
    if(formData.get('onlyClientVehicles')=='on'){
        vehicleId = formData.get('vehicleId[value]');
    }

    let clientId = formData.get('clientId[value]');

    if (formData.get('newClientMode') === 'on') {
        const newClientBody = {
            firstName: formData.get('newClientFirstName'),
            lastName: formData.get('newClientLastName'),
            phone: formData.get('newClientPhone'),
            emailAddresses: [],
            introducedAt: new Date(),
        };
        const clientRes = await httpPost({ url: 'privateclients', body: newClientBody });
        clientId = await clientRes.json();
    }
 //Guid? ClientId, string Description, Guid? VehicleId, Guid[] AssignedTo, int? Odo, bool StartWithOffer
    const body = {
       clientId:clientId ==''?null:clientId,
       description: formData.get('about'),
       vehicleId: vehicleId??null,
       assignedTo:formData.getAll('mechanics'),
       odo: +(formData.get('odo')?.toString()??'0'),
       startWithOffer: formData.get('isOffer') == 'on'
    }; 
    const url = "work"; 
    
    const isUpdating = !!id;
    
    const response = isUpdating?await httpPut({url:url+'/'+id,body}) : await httpPost({url,body});

    const jsonResponse = await response.json();
       
    const isInvoiceDraft = formData.get('invoiceMode') === 'on';
    pushToast(`${isInvoiceDraft ? 'Invoice draft' : 'Work'} ${(isUpdating?'updated':'saved')} successfully!`)

    if(id)
        redirect(`/home/work/${jsonResponse}`)

    if(isUpdating){
        redirect(`/home/work/${jsonResponse.workId}/${jsonResponse.activityId}`)
    }
    const invoiceQuery = isInvoiceDraft ? '?mode=invoice' : '';
    redirect(`/home/work/${jsonResponse.workId}/${jsonResponse.activityId}/edit/startfresh${invoiceQuery}`)
    
}

