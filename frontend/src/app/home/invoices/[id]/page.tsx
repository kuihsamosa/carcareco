import InvoiceDetail from '../_components/InvoiceDetail';
import AutoPrint from '../_components/AutoPrint';

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const { id } = await params;
  const { print } = await searchParams;
  return (
    <>
      <InvoiceDetail id={id} />
      {print === '1' && <AutoPrint />}
    </>
  );
}
