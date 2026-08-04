'use server';
import { httpGet } from "@/_lib/server/query-api";


export async function downloadPricing({
    pricingId,
    pricingName,
    downloadHtml,
}:{
    pricingId:string,
    pricingName:string,
    downloadHtml?:boolean| undefined
}) {

    const response = await httpGet(`pricings/${pricingName}/${pricingId}/${downloadHtml?'html':'pdf'}`);

    if (downloadHtml) {
        return await response.text();
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
}
