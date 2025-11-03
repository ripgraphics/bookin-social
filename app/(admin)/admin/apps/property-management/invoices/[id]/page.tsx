import { Suspense } from 'react';
import Link from 'next/link';
import { Pencil, FileText, Send, DollarSign, Download, Trash2 } from 'lucide-react';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';

async function getInvoiceById(invoiceId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/invoices/v2/${invoiceId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch invoice:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

async function InvoiceDetailsContent({ invoiceId }: { invoiceId: string }) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/');
  }

  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The invoice you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/apps/property-management/invoices"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'paid':
        return 'active';
      case 'sent':
        return 'pending';
      case 'overdue':
        return 'inactive';
      case 'draft':
      default:
        return 'draft';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {invoice.invoice_number}
              </h1>
              <StatusBadge 
                status={invoice.status} 
                variant={getStatusVariant(invoice.status)}
              />
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                {invoice.invoice_type}
              </span>
            </div>
            <p className="text-gray-600">
              Issued on {new Date(invoice.issue_date).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/admin/apps/property-management/invoices/${invoiceId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              Send
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invoice.customer_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invoice.customer_email}</dd>
                </div>
                {invoice.customer_address && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {invoice.customer_address.street && <div>{invoice.customer_address.street}</div>}
                      {(invoice.customer_address.city || invoice.customer_address.state || invoice.customer_address.zip) && (
                        <div>
                          {invoice.customer_address.city}{invoice.customer_address.state && `, ${invoice.customer_address.state}`} {invoice.customer_address.zip}
                        </div>
                      )}
                      {invoice.customer_address.country && <div>{invoice.customer_address.country}</div>}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.invoice_line_items && invoice.invoice_line_items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.tax_amount || 0, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total_amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Financial Summary */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="space-y-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(invoice.tax_amount, invoice.currency)}
                  </span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(invoice.discount_amount, invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.amount_paid, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-2">
                  <span className="text-gray-900">Amount Due:</span>
                  <span className="text-gray-900">
                    {formatCurrency(invoice.amount_due, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(invoice.notes || invoice.terms) && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
              </div>
              <div className="p-6 space-y-4">
                {invoice.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Notes</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{invoice.notes}</dd>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Terms & Conditions</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{invoice.terms}</dd>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(invoice.issue_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Currency</dt>
                <dd className="mt-1 text-sm text-gray-900">{invoice.currency}</dd>
              </div>
              {invoice.property_management && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/admin/apps/property-management/properties/${invoice.property_management.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {invoice.property_management.listings?.title || 'View Property'}
                    </Link>
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Issued By/To */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Parties</h2>
            </div>
            <div className="p-6 space-y-4">
              {invoice.issued_by_user && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Issued By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {invoice.issued_by_user.first_name} {invoice.issued_by_user.last_name}
                  </dd>
                  <dd className="text-sm text-gray-500">{invoice.issued_by_user.email}</dd>
                </div>
              )}
              {invoice.issued_to_user && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Issued To</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {invoice.issued_to_user.first_name} {invoice.issued_to_user.last_name}
                  </dd>
                  <dd className="text-sm text-gray-500">{invoice.issued_to_user.email}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function InvoiceDetailsPage({
  params
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<LoadingSkeleton type="card" count={3} />}>
        <InvoiceDetailsContent invoiceId={params.id} />
      </Suspense>
    </div>
  );
}

