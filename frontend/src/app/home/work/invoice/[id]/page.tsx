import { redirect } from 'next/navigation';

// Invoices now live under their own section. Keep this old URL working by
// redirecting to the canonical /home/invoices/[id] page.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/home/invoices/${id}`);
}
