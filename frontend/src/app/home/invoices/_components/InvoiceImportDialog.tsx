'use client'

import { useState, useRef, useCallback } from 'react'
import { getCookie } from 'cookies-next/client'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'

const API = process.env.NEXT_PUBLIC_API_URL

interface ImportResult {
  fileName: string
  invoiceNumber?: number
  date?: string
  customer?: string
  plate?: string
  total?: number
  lineCount: number
  status: string
  reason?: string
  warnings?: string[]
}

interface ImportResponse {
  dryRun: boolean
  summary: { created: number; skipped: number; failed: number; total: number }
  results: ImportResult[]
}

type Phase = 'idle' | 'uploading' | 'preview' | 'importing' | 'done'

export default function InvoiceImportDialog() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [files, setFiles] = useState<File[]>([])
  const [response, setResponse] = useState<ImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setPhase('idle')
    setFiles([])
    setResponse(null)
    setError(null)
  }, [])

  const doImport = useCallback(async (selectedFiles: File[], dryRun: boolean) => {
    setError(null)
    setPhase(dryRun ? 'uploading' : 'importing')

    const formData = new FormData()
    selectedFiles.forEach(f => formData.append('files', f))

    const jwt = getCookie('jwt')
    try {
      const res = await fetch(`${API}/api/invoices/import?dryRun=${dryRun}`, {
        method: 'POST',
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        body: formData,
      })
      if (!res.ok) {
        setError(await res.text())
        setPhase('idle')
        return
      }
      const data: ImportResponse = await res.json()
      setResponse(data)
      setPhase(dryRun ? 'preview' : 'done')
    } catch (e) {
      setError(String(e))
      setPhase('idle')
    }
  }, [])

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    setFiles(selected)
    doImport(selected, true)
  }

  const confirmImport = () => {
    doImport(files, false)
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      preview: 'bg-blue-50 text-blue-700',
      created: 'bg-green-50 text-green-700',
      skipped: 'bg-yellow-50 text-yellow-700',
      failed: 'bg-red-50 text-red-700',
    }
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { reset(); setOpen(true) }}
        className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 transition-colors"
      >
        <ArrowUpTrayIcon className="size-4" />
        Import
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-3xl rounded-xl bg-white shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Import Invoices from Excel
              </DialogTitle>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {phase === 'idle' && (
                <div className="text-center py-12">
                  <ArrowUpTrayIcon className="mx-auto size-12 text-gray-300" />
                  <p className="mt-4 text-sm text-gray-600">
                    Select one or more <strong>.xlsx</strong> invoice files to import.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Existing invoices (by number) will be skipped automatically.
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                  >
                    Choose Files
                  </button>
                </div>
              )}

              {(phase === 'uploading' || phase === 'importing') && (
                <div className="text-center py-12">
                  <div className="mx-auto size-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
                  <p className="mt-4 text-sm text-gray-600">
                    {phase === 'uploading' ? 'Parsing files…' : 'Importing invoices…'}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {response && (phase === 'preview' || phase === 'done') && (
                <>
                  <div className="mb-4 flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-900">{response.summary.total} invoices</span>
                    {response.summary.created > 0 && <span className="text-green-600">{response.summary.created} created</span>}
                    {response.summary.skipped > 0 && <span className="text-yellow-600">{response.summary.skipped} skipped</span>}
                    {response.summary.failed > 0 && <span className="text-red-600">{response.summary.failed} failed</span>}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 pr-3 text-left text-xs font-medium text-gray-500">#</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Customer</th>
                          <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Plate</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Total</th>
                          <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Lines</th>
                          <th className="py-2 pl-3 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {response.results.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-1.5 pr-3 font-medium text-gray-900">{r.invoiceNumber ?? '—'}</td>
                            <td className="py-1.5 px-3 text-gray-600">{r.date ?? '—'}</td>
                            <td className="py-1.5 px-3 text-gray-600 max-w-[200px] truncate">{r.customer ?? '—'}</td>
                            <td className="py-1.5 px-3 font-mono text-xs text-gray-500">{r.plate ?? '—'}</td>
                            <td className="py-1.5 px-3 text-right text-gray-700">{r.total?.toFixed(2) ?? '—'}</td>
                            <td className="py-1.5 px-3 text-right text-gray-500">{r.lineCount}</td>
                            <td className="py-1.5 pl-3">
                              {statusBadge(r.status)}
                              {r.reason && <span className="ml-1.5 text-xs text-gray-400">{r.reason}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="border-t px-6 py-4 flex items-center justify-end gap-3">
              {phase === 'preview' && (
                <>
                  <button
                    type="button"
                    onClick={() => { reset() }}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmImport}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                  >
                    Confirm Import
                  </button>
                </>
              )}
              {phase === 'done' && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); window.location.reload() }}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
