export function formatMoney(amount: number): string {
  return 'RM ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
