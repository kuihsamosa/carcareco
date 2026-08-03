'use client';

import { PencilSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState, useCallback } from 'react';

export default function SignatureUpload({
    initialBase64,
    label,
    fieldName,
}: {
    initialBase64: string | null;
    label: string;
    fieldName: string;
}) {
    const [base64, setBase64] = useState(initialBase64 ?? '');

    const previewSrc = base64 ? `data:image/png;base64,${base64}` : null;

    const processFile = useCallback(async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be under 2 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setBase64(result.split('base64,')[1]);
        };
        reader.readAsDataURL(file);
    }, []);

    return (
        <div className="space-y-2">
            <input type="hidden" name={fieldName} value={base64} />
            <label className="block text-sm font-medium text-foreground">{label}</label>

            {previewSrc ? (
                <div className="flex items-center gap-3">
                    <div className="flex h-14 w-40 items-center justify-center rounded border border-border bg-card p-2">
                        <Image
                            src={previewSrc}
                            alt={label}
                            width={140}
                            height={48}
                            className="max-h-12 w-auto object-contain"
                            unoptimized
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => document.getElementById(`sig-${fieldName}`)?.click()}
                        className="cursor-pointer text-sm text-primary hover:text-primary/80"
                    >
                        Change
                    </button>
                    <button
                        type="button"
                        onClick={() => setBase64('')}
                        className="cursor-pointer text-sm text-red-600 hover:text-red-500"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => document.getElementById(`sig-${fieldName}`)?.click()}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-gray-400 hover:text-muted-foreground"
                >
                    <PencilSquareIcon className="size-5" />
                    Upload signature image
                </button>
            )}

            <input
                id={`sig-${fieldName}`}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                }}
            />
            <p className="text-xs text-muted-foreground">PNG or JPG, transparent background recommended</p>
        </div>
    );
}
