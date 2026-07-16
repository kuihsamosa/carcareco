'use client'

import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1.5 inline-flex text-gray-300 hover:text-gray-500 transition-colors"
      title="Copy"
    >
      {copied
        ? <CheckIcon className="size-3.5 text-green-500" />
        : <ClipboardDocumentIcon className="size-3.5" />}
    </button>
  );
}
