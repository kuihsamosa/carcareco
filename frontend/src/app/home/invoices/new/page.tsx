'use server'

import WorkInput from '../../work/_components/WorkInput';
import { createOrUpdate } from '../../work/actions/createOrUpdate';
import Main from '../../_components/Main';
import { CardHeader } from '@/_components/Card';
import { httpGet } from '@/_lib/server/query-api';
import { IMechanic } from '../../work/model';

// New Invoice = a thin entry over the work model. Picking a customer/vehicle
// here creates the underlying work + job, then drops the user straight into the
// line-item editor where they add services/parts and issue the invoice.
export default async function Page() {
    const response = await httpGet('employees');
    const employees = await response.json() as IMechanic[];

    return (
        <Main header={<CardHeader title='New invoice' description='Pick a customer, then add services & parts' />}>
            <form action={createOrUpdate}>
                <input type="hidden" name='id' />
                <WorkInput mechanics={employees} invoiceMode={true} />
            </form>
        </Main>
    );
}
