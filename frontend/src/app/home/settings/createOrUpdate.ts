'use server'

import { httpPut } from "@/_lib/server/query-api";
import {  pushToast } from "@/_lib/server/pushToast";
import { redirect } from "next/navigation";
import { IUserOptions } from "./model";


export async function createOrUpdate(
    formData: FormData
    ) {

    const vatRate = +(formData.get('vatRate')?.toString()??'0');
    const signatureLine = formData.get('signatureLine') == 'on';
    const dueDays = +(formData.get('dueDays')?.toString() ?? '30');

    const body = {
      requisites: {
        name: formData.get('name'),
        tagline: formData.get('tagline'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        website: formData.get('website'),
        address: formData.get('address'),
        address2: formData.get('address2'),
        city: formData.get('city'),
        postcode: formData.get('postcode'),
        state: formData.get('state'),
        country: formData.get('country'),
        bankAccount: formData.get('bankAccount'),
        regNr: formData.get('regNr'),
        kmkr: formData.get('kmkr'),
        currency: formData.get('currency') || 'MYR',
        logoBase64: formData.get('logoBase64') || null,
        logoContentType: formData.get('logoContentType') || null,
      },
      pricing: {
        invoice: {
          vatRate: vatRate,
          surCharge: formData.get('surCharge'),
          disclaimer: formData.get('disclaimer'),
          signatureLine: signatureLine,
          emailContent: formData.get('emailContent'),
          termsAndConditions: formData.get('termsAndConditions'),
          workshopSignatureBase64: formData.get('workshopSignatureBase64') || null,
          invoiceNumberPrefix: formData.get('invoiceNumberPrefix') || 'INV',
          dueDays: dueDays,
        },
        estimate: {
          emailContent: formData.get('estimateEmailContent')
        }
      }
    }  as IUserOptions;

    const response =  await httpPut({url:'options',body})

     await response.text();

    pushToast(`Settings saved successfully!`)

    redirect('/home/settings')
}
