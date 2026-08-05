
'use client';

import { PaperClipIcon } from '@heroicons/react/20/solid';
import { downloadPricing } from '../../actions/downloadPricing';
import { useState } from 'react';
import Spinner from '@/_components/Spinner';
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import Link from 'next/link';
import PrintPricingLink from './PrintPricingLink';


const handleFileDownload = async (pricingId: string, pricingName: string) => {
    const html = await downloadPricing({
      pricingId, pricingName, downloadHtml: true
    }) as string;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8" />
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: white; }
        body { padding: 32px; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; }
        @page { size: A4; margin: 10mm; }
      </style>
    </head><body>${html}</body></html>`);
    doc.close();

    const cleanup = () => {
      try { document.body.removeChild(iframe); } catch { /* already removed */ }
    };
    iframe.contentWindow?.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
}

export default function PricingDownloadLink({
    id,
    name,
    number,
    downloadingElement= <>{<Spinner></Spinner>}</>,
    hidePaperClip = true,
    hideLabel,
    clickableElement=<>{<ArrowDownTrayIcon aria-hidden="true" className="h-6 w-5 text-gray-400" ></ArrowDownTrayIcon>}</>,
}:{
    id:string,
    name:string,
    number:string | number ,
    clickableElement?: React.ReactNode,
    downloadingElement?: React.ReactNode,
    hidePaperClip?: boolean,
    hideLabel?:boolean
}) {

    const [isDownloading,setIsDownloading] = useState(false);

    return (
        <div className="flex  ">
       {!hidePaperClip&&   <PaperClipIcon aria-hidden="true" className="h-6 w-5 text-gray-400 mr-4" />}
        <div className=" flex min-w-0 flex-1 gap-2">
          {!hideLabel&& <span className="truncate text-sm/6 font-bold">{number}</span> }
            <div className=" text-sm/6 text-gray-500">
                <Link href="#"  onClick={async (e)=>{
                   e.preventDefault();
                   if (isDownloading) return;
                    setIsDownloading(true);
                    try {
                      await handleFileDownload(id, name);
                    } catch (error) {
                      console.log("Error", error);
                    } finally {
                      setIsDownloading(false);
                    }

                }} className="font-medium text-indigo-600 hover:text-indigo-500">
                    {!isDownloading&&clickableElement} {isDownloading&& downloadingElement}
                </Link>
            </div>
            <div className=" text-sm/6 text-gray-500">
               <PrintPricingLink id={id} pricingName={name}></PrintPricingLink>
            </div>
        </div>
    </div>
    )
}

export {
  handleFileDownload
}
