'use client'

import { PrinterIcon } from '@heroicons/react/24/outline';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      title="Print"
    >
      <PrinterIcon className="size-5" />
    </button>
  );
}
