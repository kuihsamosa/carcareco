'use client'

export interface FlowNode {
  id: string
  label: string
  description?: string
  type?: 'start' | 'step' | 'decision' | 'end'
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
}

function nodeStyle(type: FlowNode['type']) {
  switch (type) {
    case 'start':
      return 'bg-primary/10 border-primary/30 text-primary'
    case 'end':
      return 'bg-success/10 border-success/30 text-success'
    case 'decision':
      return 'bg-warning/10 border-warning/30 text-warning rotate-45'
    default:
      return 'bg-card border-border text-foreground'
  }
}

function NodeBox({ node }: { node: FlowNode }) {
  const isDecision = node.type === 'decision'
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex items-center justify-center border-2 px-4 py-2.5 text-center text-sm font-medium shadow-sm ${nodeStyle(node.type)} ${
          isDecision ? 'size-20 rounded-lg' : 'min-w-[140px] rounded-xl'
        }`}
      >
        <span className={isDecision ? '-rotate-45 text-xs' : ''}>{node.label}</span>
      </div>
      {node.description && (
        <p className="max-w-[180px] text-center text-[11px] text-muted-foreground">{node.description}</p>
      )}
    </div>
  )
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="h-5 w-px bg-border" />
      {label && (
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{label}</span>
      )}
      <svg className="size-3 text-border" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 12L0 4h12z" />
      </svg>
    </div>
  )
}

export default function Flowchart({ nodes, edges, title }: { nodes: FlowNode[]; edges: FlowEdge[]; title: string }) {
  const ordered: { node: FlowNode; edgeLabel?: string }[] = []
  const startNode = nodes.find(n => n.type === 'start') || nodes[0]

  let current: string | undefined = startNode.id
  const visited = new Set<string>()
  while (current && !visited.has(current)) {
    visited.add(current)
    const node = nodes.find(n => n.id === current)
    if (!node) break
    const inEdge = edges.find(e => e.to === current && visited.has(e.from))
    ordered.push({ node, edgeLabel: inEdge?.label })
    const outEdge = edges.find(e => e.from === current)
    current = outEdge?.to
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-6 text-base font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col items-center">
        {ordered.map(({ node, edgeLabel }, i) => (
          <div key={node.id} className="flex flex-col items-center">
            {i > 0 && <Arrow label={edgeLabel} />}
            <NodeBox node={node} />
          </div>
        ))}
      </div>
    </div>
  )
}
