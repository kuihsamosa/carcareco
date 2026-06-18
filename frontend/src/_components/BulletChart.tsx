export interface IBulletChartItem {
    label: string
    actual: number
    target: number
    unit?: string
    badThreshold?: number
    goodThreshold?: number
}

function BulletChartRow({ item }: { item: IBulletChartItem }) {
    const { label, actual, target, unit = '', badThreshold, goodThreshold } = item
    const bad = badThreshold ?? target * 0.6
    const good = goodThreshold ?? target * 0.85
    const pct = (v: number) => Math.min(100, Math.round((v / target) * 100))

    return (
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{label}</span>
                <span className="font-medium text-gray-800">
                    {actual.toLocaleString()}{unit} / {target.toLocaleString()}{unit}
                </span>
            </div>
            <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
                <div
                    className="absolute left-0 top-1 h-3 rounded-l"
                    style={{ width: `${pct(bad)}%`, background: '#FFCDD2' }}
                />
                <div
                    className="absolute left-0 top-1 h-3"
                    style={{ width: `${pct(good)}%`, background: '#FFF9C4' }}
                />
                <div
                    className="absolute left-0 top-1 h-3"
                    style={{ width: `${pct(target)}%`, background: '#C8E6C9' }}
                />
                <div
                    className="absolute left-0 top-1.5 h-2 rounded"
                    style={{ width: `${pct(actual)}%`, background: '#1976D2' }}
                />
                <div
                    className="absolute right-0 top-0 w-0.5 h-5 bg-slate-800 rounded"
                />
            </div>
        </div>
    )
}

export default function BulletChart({ items, legend = true }: { items: IBulletChartItem[], legend?: boolean }) {
    return (
        <div className="flex flex-col gap-4">
            {items.map((item, i) => (
                <BulletChartRow key={i} item={item} />
            ))}
            {legend && (
                <div className="flex gap-3 flex-wrap mt-1">
                    {[
                        { color: '#FFCDD2', label: 'Below' },
                        { color: '#FFF9C4', label: 'On track' },
                        { color: '#C8E6C9', label: 'Target zone' },
                        { color: '#1976D2', label: 'Actual' },
                    ].map(({ color, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
