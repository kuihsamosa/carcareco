
'use client';

import { PaperClipIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';
import Spinner from '@/_components/Spinner';
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import Link from 'next/link';
import PrintPricingLink from './PrintPricingLink';
import { savePricingDocument } from '@/_lib/client/savePricingDocument';


const handleFileDownload = async (pricingId: string, pricingName: string, fileName: string) => {
    await savePricingDocument({ pricingId, pricingName, fileName });
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
    const fileName = `${name.toLowerCase()}_${number}.pdf`;

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
                      await handleFileDownload(id, name, fileName);
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
