import { Suspense } from 'react';
import Link from 'next/link';
import { Pencil, Receipt, CheckCircle, XCircle, Download } from 'lucide-react';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';

async function getExpenseById(expenseId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/expenses/${expenseId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch expense:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching expense:', error);
    return null;
  }
}

async function ExpenseDetailsContent({ expenseId }: { expenseId: string }) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/');
  }

  const expense = await getExpenseById(expenseId);

  if (!expense) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Expense not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The expense you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/apps/property-management/expenses"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Expenses
          </Link>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'paid':
      case 'reimbursed':
        return 'active';
      case 'approved':
        return 'pending';
      case 'pending':
        return 'draft';
      case 'rejected':
        return 'inactive';
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
                {expense.description || 'Expense Details'}
              </h1>
              <StatusBadge 
                status={expense.status} 
                variant={getStatusVariant(expense.status)}
              />
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                {expense.expense_type}
              </span>
            </div>
            <p className="text-gray-600">
              Created on {new Date(expense.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            {expense.status === 'pending' && (
              <>
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </>
            )}
            <Link
              href={`/admin/apps/property-management/expenses/${expenseId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Expense Information</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {expense.property_management ? (
                      <Link
                        href={`/admin/apps/property-management/properties/${expense.property_id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {expense.property_management.listings?.title || 'View Property'}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expense Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {expense.payment_method?.replace('_', ' ') || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Vendor</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {expense.vendor_name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {expense.category || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {expense.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {expense.notes}
                </p>
              </div>
            </div>
          )}

          {/* Receipt */}
          {expense.receipt_url && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Receipt</h2>
              </div>
              <div className="p-6">
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  View Receipt
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Information */}
          {expense.status !== 'pending' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Approval Status</h2>
              </div>
              <div className="p-6 space-y-4">
                {expense.approved_by_user && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {expense.approved_by_user.first_name} {expense.approved_by_user.last_name}
                    </dd>
                    <dd className="text-sm text-gray-500">{expense.approved_by_user.email}</dd>
                  </div>
                )}
                {expense.approved_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(expense.approved_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {expense.rejection_reason && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {expense.rejection_reason}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Created By</h2>
            </div>
            <div className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {expense.created_by_user?.first_name} {expense.created_by_user?.last_name}
                </p>
                <p className="text-sm text-gray-500">{expense.created_by_user?.email}</p>
              </div>
            </div>
          </div>

          {/* Linked Invoice */}
          {expense.invoices_v2 && expense.invoices_v2.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Linked Invoice</h2>
              </div>
              <div className="p-6">
                <Link
                  href={`/admin/apps/property-management/invoices/${expense.invoices_v2.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {expense.invoices_v2.invoice_number}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ExpenseDetailsPage({
  params
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<LoadingSkeleton type="card" count={3} />}>
        <ExpenseDetailsContent expenseId={params.id} />
      </Suspense>
    </div>
  );
}

