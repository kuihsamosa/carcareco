import { type Metadata } from 'next'
import Link from 'next/link'
import Flowchart from './_components/Flowchart'
import type { FlowNode, FlowEdge } from './_components/Flowchart'

export const metadata: Metadata = { title: 'Help' }

const quickInvoice: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: 'start', label: 'Start', type: 'start' },
    { id: 'nav', label: 'Go to Invoices', description: 'Click Invoices in the sidebar' },
    { id: 'new', label: 'Click "Add new"', description: 'Opens the paper editor' },
    { id: 'fill', label: 'Fill in details', description: 'Client, vehicle, line items, VAT' },
    { id: 'save', label: 'Save & Print', description: 'Creates invoice and opens print view' },
    { id: 'done', label: 'Done', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'nav' },
    { from: 'nav', to: 'new' },
    { from: 'new', to: 'fill' },
    { from: 'fill', to: 'save' },
    { from: 'save', to: 'done' },
  ],
}

const workOrderFlow: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: 'start', label: 'Start', type: 'start' },
    { id: 'create', label: 'New work order', description: 'Work → Add new' },
    { id: 'assign', label: 'Assign mechanic', description: 'Pick vehicle, client, mechanic' },
    { id: 'products', label: 'Add products', description: 'Add parts and services to the job' },
    { id: 'invoice', label: 'Issue invoice', description: 'Click "Issue" to generate invoice' },
    { id: 'print', label: 'Print / send', description: 'Download PDF or print' },
    { id: 'done', label: 'Done', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'create' },
    { from: 'create', to: 'assign' },
    { from: 'assign', to: 'products' },
    { from: 'products', to: 'invoice' },
    { from: 'invoice', to: 'print' },
    { from: 'print', to: 'done' },
  ],
}

const importFlow: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: 'start', label: 'Start', type: 'start' },
    { id: 'nav', label: 'Go to Invoices', description: 'Click Invoices in the sidebar' },
    { id: 'import', label: 'Click Import', description: 'Opens the import dialog' },
    { id: 'upload', label: 'Upload .xlsx', description: 'Select your spreadsheet file' },
    { id: 'review', label: 'Review & confirm', description: 'Check parsed rows before saving' },
    { id: 'done', label: 'Done', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'nav' },
    { from: 'nav', to: 'import' },
    { from: 'import', to: 'upload' },
    { from: 'upload', to: 'review' },
    { from: 'review', to: 'done' },
  ],
}

const clientsFlow: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: 'start', label: 'Start', type: 'start' },
    { id: 'clients', label: 'Go to Clients', description: 'Sidebar → Clients' },
    { id: 'add', label: 'Add new client', description: 'Fill name, phone, email, address' },
    { id: 'vehicle', label: 'Add vehicle', description: 'Go to Vehicles → Add new' },
    { id: 'link', label: 'Link to client', description: 'Select the client on vehicle form' },
    { id: 'done', label: 'Done', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'clients' },
    { from: 'clients', to: 'add' },
    { from: 'add', to: 'vehicle' },
    { from: 'vehicle', to: 'link' },
    { from: 'link', to: 'done' },
  ],
}

const inventoryFlow: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    { id: 'start', label: 'Start', type: 'start' },
    { id: 'nav', label: 'Go to Inventory', description: 'Sidebar → Stock' },
    { id: 'add', label: 'Add product', description: 'Code, name, price, stock quantity' },
    { id: 'services', label: 'Or add service', description: 'Sidebar → Services for labour items' },
    { id: 'use', label: 'Use in work order', description: 'Products appear in the job editor' },
    { id: 'done', label: 'Done', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'nav' },
    { from: 'nav', to: 'add' },
    { from: 'add', to: 'services', label: 'or' },
    { from: 'services', to: 'use' },
    { from: 'use', to: 'done' },
  ],
}

const workflows = [
  { id: 'quick-invoice', title: '1. Quick invoice (direct)', ...quickInvoice },
  { id: 'work-order', title: '2. Work order → job → invoice', ...workOrderFlow },
  { id: 'import', title: '3. Importing invoices from xlsx', ...importFlow },
  { id: 'clients', title: '4. Managing clients & vehicles', ...clientsFlow },
  { id: 'inventory', title: '5. Inventory & services', ...inventoryFlow },
]

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">Help centre</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Step-by-step guides for every workflow. Click a section to jump to its flowchart.
      </p>

      <nav className="mb-8 rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contents</p>
        <ul className="space-y-1">
          {workflows.map(w => (
            <li key={w.id}>
              <a href={`#${w.id}`} className="text-sm text-primary hover:text-primary/80 transition-colors">
                {w.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-8">
        {workflows.map(w => (
          <section key={w.id} id={w.id} className="scroll-mt-20">
            <Flowchart nodes={w.nodes} edges={w.edges} title={w.title} />
          </section>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/home" className="text-sm text-primary hover:text-primary/80">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  )
}
