import SalesTracker from './_components/SalesTracker'
import SalesPinGate from './_components/SalesPinGate'

export default function SalesPage() {
  return (
    <SalesPinGate>
      <SalesTracker />
    </SalesPinGate>
  )
}
