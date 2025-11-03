import { Suspense } from 'react';
import Link from 'next/link';
import { Pencil, Building2, Users, DollarSign, FileText, Receipt, Calendar } from 'lucide-react';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';

async function getPropertyById(propertyId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/properties/management/${propertyId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch property:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

async function getPropertyInvoices(propertyId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/invoices/v2?property_id=${propertyId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.slice(0, 5); // Get only 5 most recent
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

async function getPropertyExpenses(propertyId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/expenses?property_id=${propertyId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.slice(0, 5); // Get only 5 most recent
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
}

async function PropertyDetailsContent({ propertyId }: { propertyId: string }) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/');
  }

  const [property, invoices, expenses] = await Promise.all([
    getPropertyById(propertyId),
    getPropertyInvoices(propertyId),
    getPropertyExpenses(propertyId)
  ]);

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Property not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The property you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/apps/property-management/properties"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {property.listings?.title || 'Untitled Property'}
              </h1>
              <StatusBadge status="Active" variant="active" />
            </div>
            <p className="text-gray-600">
              {property.listings?.city && property.listings?.country 
                ? `${property.listings.city}, ${property.listings.country}`
                : 'Property details'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/admin/apps/property-management/properties/${propertyId}/edit`}
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
          {/* Property Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Property Information
              </h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Management Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {property.management_type?.replace('_', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Currency</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.currency || 'USD'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.payment_terms || 30} days
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Auto-Invoice</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.auto_invoice ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Settings
              </h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.commission_rate}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cleaning Fee</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${property.cleaning_fee || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service Fee Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.service_fee_rate}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tax Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {property.tax_rate}%
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Host/Co-Host Assignments */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Host & Co-Host Assignments
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Manage
                </button>
              </div>
            </div>
            <div className="p-6">
              {property.property_assignments && property.property_assignments.length > 0 ? (
                <div className="space-y-4">
                  {property.property_assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.users?.first_name} {assignment.users?.last_name}
                          </p>
                          <StatusBadge 
                            status={assignment.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} 
                            variant={assignment.status === 'active' ? 'active' : 'inactive'}
                          />
                        </div>
                        <p className="text-sm text-gray-500">{assignment.users?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{assignment.commission_rate}%</p>
                        <p className="text-xs text-gray-500">Commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No host or co-host assignments yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Owner</h2>
            </div>
            <div className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {property.owner?.first_name} {property.owner?.last_name}
                </p>
                <p className="text-sm text-gray-500">{property.owner?.email}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  Total Invoices
                </div>
                <span className="text-sm font-medium text-gray-900">{invoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Receipt className="w-4 h-4 mr-2" />
                  Total Expenses
                </div>
                <span className="text-sm font-medium text-gray-900">{expenses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <Link
                href={`/admin/apps/property-management/invoices?property_id=${propertyId}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <Link
                        href={`/admin/apps/property-management/invoices/${invoice.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {invoice.invoice_number}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{invoice.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${invoice.total_amount}</p>
                      <StatusBadge status={invoice.status} variant={invoice.status as any} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No invoices yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
              <Link
                href={`/admin/apps/property-management/expenses?property_id=${propertyId}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.map((expense: any) => (
                  <div key={expense.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <Link
                        href={`/admin/apps/property-management/expenses/${expense.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {expense.description}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{expense.expense_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${expense.amount}</p>
                      <StatusBadge status={expense.status} variant={expense.status as any} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No expenses yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PropertyDetailsPage({
  params
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<LoadingSkeleton type="card" count={3} />}>
        <PropertyDetailsContent propertyId={params.id} />
      </Suspense>
    </div>
  );
}

