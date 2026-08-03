'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState, useCallback } from 'react';

export default function LogoUpload({
    initialBase64,
    initialContentType,
}: {
    initialBase64: string | null;
    initialContentType: string | null;
}) {
    const [base64, setBase64] = useState(initialBase64 ?? '');
    const [contentType, setContentType] = useState(initialContentType ?? '');
    const [dragOver, setDragOver] = useState(false);

    const previewSrc = base64 ? `data:${contentType};base64,${base64}` : null;

    const processFile = useCallback(async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            alert('Logo must be under 2 MB.');
            return;
        }
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const b64 = result.split('base64,')[1];
            setBase64(b64);
            setContentType(file.type);
        };
        reader.readAsDataURL(file);
    }, []);

    return (
        <div className="space-y-3">
            <input type="hidden" name="logoBase64" value={base64} />
            <input type="hidden" name="logoContentType" value={contentType} />

            {previewSrc ? (
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-44 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <Image
                            src={previewSrc}
                            alt="Workshop logo"
                            width={160}
                            height={56}
                            className="max-h-14 w-auto object-contain"
                            unoptimized
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={() => document.getElementById('logo-file-input')?.click()}
                            className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset transition-colors hover:bg-gray-50"
                        >
                            Change
                        </button>
                        <button
                            type="button"
                            onClick={() => { setBase64(''); setContentType(''); }}
                            className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => document.getElementById('logo-file-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) processFile(file);
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
                        dragOver
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                    <PhotoIcon className="mx-auto size-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-400">PNG, JPG, or SVG up to 2 MB</p>
                </div>
            )}

            <input
                id="logo-file-input"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                }}
            />
        </div>
    );
}
