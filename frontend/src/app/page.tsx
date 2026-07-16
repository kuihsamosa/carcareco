'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import FormInput from '@/_components/FormInput'
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  UsersIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

interface DemoCredentials {
  username: string
  password: string
}

const features = [
  {
    name: 'Work orders & daily job board',
    description: 'Create work orders, assign mechanics, track progress. See today\'s jobs at a glance on the dashboard.',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'One-click invoicing with PDF',
    description: 'Generate invoices directly from completed work. Download or email professional PDFs instantly.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Service history autosuggest',
    description: 'The line-item editor learns from past work — service names and prices auto-populate as you type.',
    icon: WrenchScrewdriverIcon,
  },
  {
    name: 'Inventory with low-stock alerts',
    description: 'Track spare parts, quantities, and prices. Link parts directly to work orders.',
    icon: ArchiveBoxIcon,
  },
  {
    name: 'Clients & vehicles with full history',
    description: 'Every client and vehicle has a complete service timeline. Look up by plate, VIN, or name.',
    icon: UsersIcon,
  },
  {
    name: 'Sales dashboard',
    description: 'Revenue trends, top services, and invoice status — all in one view.',
    icon: ChartBarIcon,
  },
]

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<DemoCredentials | null>(null)
  const [error, setError] = useState('')

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
    setCredentials(null)
    setError('')
  }

  const handleCreateDemo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Demo/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }),
      })
      if (response.status === 429) {
        const errorData = await response.json()
        setError(errorData.message || 'Rate limit exceeded. Please try again later.')
        setIsLoading(false)
        return
      }
      if (!response.ok) {
        const errorData = await response.text()
        setError(errorData || 'Could not create demo account. Please try again later.')
        setIsLoading(false)
        return
      }
      const data = await response.json()
      setCredentials(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create demo account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="size-7 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">CarCare</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/rene98c/carcareco"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              GitHub
            </Link>
            <Link
              href="/auth/login"
              className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Log in
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Workshop management{' '}
                <span className="text-indigo-600">that just works</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Track repairs, manage inventory, invoice clients, and see your full service history —
                all in one clean, mobile-first app. Self-hosted and free.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-4">
                <button
                  onClick={handleOpenDialog}
                  className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  Try the demo
                </button>
                <Link
                  href="https://github.com/rene98c/carcareco"
                  className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                >
                  View source
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="bg-gray-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything a workshop needs
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Built for real repair shops — not adapted from generic business software.
              </p>
            </div>
            <div className="mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature.name} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <feature.icon className="size-8 text-indigo-600" />
                    <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile showcase */}
        <div className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
                <DevicePhoneMobileIcon className="size-4" />
                Mobile-first design
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Works on any device
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Check jobs, create invoices, and look up vehicle history right from the shop floor.
                Every screen is touch-optimized with card layouts, swipe-friendly tables, and large tap targets.
              </p>
            </div>
          </div>
        </div>

        {/* Tech stack / self-hosted */}
        <div className="bg-gray-900 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <TruckIcon className="mx-auto size-10 text-indigo-400" />
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Self-hosted. Your data stays yours.
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-400">
                Docker Compose, PostgreSQL, .NET backend, Next.js frontend.
                Deploy on your own server or use our hosted demo. AGPL 3.0 licensed.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
                {['Next.js', 'Tailwind CSS', '.NET 9', 'PostgreSQL', 'NHibernate', 'Docker', 'PuppeteerSharp'].map(tech => (
                  <span key={tech} className="rounded-full border border-gray-700 px-3 py-1">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Ready to try it?
            </h2>
            <p className="mt-4 text-base text-gray-600">
              Spin up a private demo environment in seconds — no sign-up required.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-4">
              <button
                onClick={handleOpenDialog}
                className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Try the demo
              </button>
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-gray-900 hover:text-gray-700"
              >
                Already have an account? Log in &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">AGPL 3.0 Licensed. Free and open source.</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="https://github.com/rene98c/carcareco" className="hover:text-gray-900">GitHub</Link>
            <Link href="/auth/login" className="hover:text-gray-900">Login</Link>
          </div>
        </div>
      </footer>

      {/* Demo dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {credentials ? 'Demo Account Created' : 'Create a Demo Account'}
            </DialogTitle>

            {credentials ? (
              <div className="mt-4">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="size-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Your demo account is ready. Use these credentials to log in:
                </p>
                <div className="mt-4 rounded-lg bg-gray-50 p-4 border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Username</span>
                    <span className="font-mono text-sm font-bold text-gray-900 bg-white py-1 px-2 rounded select-all">{credentials.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Password</span>
                    <span className="font-mono text-sm font-bold text-gray-900 bg-white py-1 px-2 rounded select-all">{credentials.password}</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    onClick={() => window.location.href = '/auth/login'}
                  >
                    Go to Login
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Enter a company name to spin up your own private sandbox.
                </p>
                <form onSubmit={handleCreateDemo} className="mt-4">
                  <FormInput
                    name="companyName"
                    label="Company Name"
                    placeholder="e.g. Mike's Auto Shop"
                    defaultValue={companyName}
                    onInputChange={(e) => setCompanyName(e.target.value)}
                    inputError={error}
                    autoFocus
                  />
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 size-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creating...
                        </span>
                      ) : 'Create Demo'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
