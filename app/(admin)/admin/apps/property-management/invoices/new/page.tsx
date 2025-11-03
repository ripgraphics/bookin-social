import InvoiceForm from '@/app/components/property-management/InvoiceForm';

export default function NewInvoicePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Invoice
        </h1>
        <p className="text-gray-600">
          Generate a rental, operational, or custom invoice for your property management business.
        </p>
      </div>

      <InvoiceForm />
    </div>
  );
}

