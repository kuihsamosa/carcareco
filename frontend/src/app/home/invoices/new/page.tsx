import { httpGet } from '@/_lib/server/query-api'
import PaperEditor from './PaperEditor'

export default async function Page() {
    const response = await httpGet('options')
    const options = await response.json()

    return <PaperEditor options={options} />
}
