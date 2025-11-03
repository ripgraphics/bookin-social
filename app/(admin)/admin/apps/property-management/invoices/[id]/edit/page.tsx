import { Suspense } from 'react';
import InvoiceForm from '@/app/components/property-management/InvoiceForm';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';

async function getInvoice(invoiceId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/invoices/v2/${invoiceId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

async function EditInvoiceContent({ invoiceId }: { invoiceId: string }) {
  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h3 className="text-sm font-medium text-gray-900">Invoice not found</h3>
      </div>
    );
  }

  return <InvoiceForm invoice={invoice} />;
}

export default async function EditInvoicePage({
  params
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit Invoice
        </h1>
        <p className="text-gray-600">
          Update invoice details and line items.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton type="form" count={10} />}>
        <EditInvoiceContent invoiceId={params.id} />
      </Suspense>
    </div>
  );
}

