import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  FileText, 
  Receipt, 
  DollarSign,
  Plus,
  TrendingUp
} from 'lucide-react';
import StatCard from '@/app/components/property-management/shared/StatCard';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';

async function getDashboardStats(userId: string) {
  // TODO: Implement actual API calls to get stats
  // For now, return mock data
  return {
    totalProperties: 12,
    activeInvoices: 8,
    pendingExpenses: 5,
    totalRevenue: '$45,230',
    trends: {
      properties: { value: 12, direction: 'up' as const },
      invoices: { value: 8, direction: 'up' as const },
      expenses: { value: 15, direction: 'down' as const },
      revenue: { value: 23, direction: 'up' as const }
    }
  };
}

async function DashboardContent() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/');
  }

  const stats = await getDashboardStats(currentUser.id);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={<Building2 className="w-6 h-6" />}
          trend={stats.trends.properties}
          color="blue"
        />
        <StatCard
          title="Active Invoices"
          value={stats.activeInvoices}
          icon={<FileText className="w-6 h-6" />}
          trend={stats.trends.invoices}
          color="green"
        />
        <StatCard
          title="Pending Expenses"
          value={stats.pendingExpenses}
          icon={<Receipt className="w-6 h-6" />}
          trend={stats.trends.expenses}
          color="yellow"
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          icon={<DollarSign className="w-6 h-6" />}
          trend={stats.trends.revenue}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/apps/property-management/properties/new"
            className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
              Add Property
            </span>
          </Link>
          
          <Link
            href="/admin/apps/property-management/invoices/new"
            className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-green-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
              Create Invoice
            </span>
          </Link>
          
          <Link
            href="/admin/apps/property-management/expenses/new"
            className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group"
          >
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-yellow-700">
              Submit Expense
            </span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Properties</h2>
              <Link
                href="/admin/apps/property-management/properties"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 text-center py-8">
              No properties yet. <Link href="/admin/apps/property-management/properties/new" className="text-blue-600 hover:text-blue-700">Add your first property</Link>
            </p>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <Link
                href="/admin/apps/property-management/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 text-center py-8">
              No invoices yet. <Link href="/admin/apps/property-management/invoices/new" className="text-blue-600 hover:text-blue-700">Create your first invoice</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Getting Started with Property Management
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Follow these steps to set up your property management system:
            </p>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-medium mr-3">
                  1
                </span>
                <span>Add your properties and configure management settings</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-medium mr-3">
                  2
                </span>
                <span>Assign hosts or co-hosts to manage your properties</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-medium mr-3">
                  3
                </span>
                <span>Create invoices for rental income or operational expenses</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-medium mr-3">
                  4
                </span>
                <span>Track expenses and manage approvals</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyManagementDashboard() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Property Management
        </h1>
        <p className="text-gray-600">
          Manage your properties, invoices, expenses, and payments all in one place.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton type="stat" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

