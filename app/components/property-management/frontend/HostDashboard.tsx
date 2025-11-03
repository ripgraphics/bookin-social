'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from '@/app/components/property-management/shared/StatCard';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import { Building2, DollarSign, FileText, Receipt, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface HostDashboardProps {
  currentUser: SafeUser;
  role: 'host' | 'co_host';
}

interface DashboardStats {
  assignedProperties: number;
  totalCommissions: number;
  pendingInvoices: number;
  submittedExpenses: number;
  recentAssignments: any[];
  recentInvoices: any[];
}

export default function HostDashboard({ currentUser, role }: HostDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/pms/host/dashboard');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-500 mb-4">Unable to load your host dashboard data.</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const roleTitle = role === 'host' ? 'Host' : 'Co-Host';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{roleTitle} Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {currentUser.firstName}! Manage your assigned properties and invoices.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Properties"
          value={stats.assignedProperties.toString()}
          icon={<Building2 className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total Commissions"
          value={`$${stats.totalCommissions.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices.toString()}
          icon={<Receipt className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Submitted Expenses"
          value={stats.submittedExpenses.toString()}
          icon={<FileText className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for {roleTitle.toLowerCase()}s</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/apps/property-management/properties"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Properties</h3>
              <p className="text-sm text-gray-500">See your assigned properties</p>
            </Link>
            <Link
              href="/apps/property-management/invoices/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Receipt className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Create Invoice</h3>
              <p className="text-sm text-gray-500">Invoice property owner for services</p>
            </Link>
            <Link
              href="/apps/property-management/expenses/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Submit Expense</h3>
              <p className="text-sm text-gray-500">Submit expenses for approval</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Properties */}
      {stats.recentAssignments && stats.recentAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Assigned Properties</CardTitle>
            <CardDescription>Properties you're currently managing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAssignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {assignment.property?.title || 'Property'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Commission: {assignment.commission_rate}% • Status: {assignment.status}
                    </p>
                  </div>
                  <Link
                    href={`/apps/property-management/properties/${assignment.property_id}`}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      {stats.recentInvoices && stats.recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Invoices you've created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentInvoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Invoice #{invoice.invoice_number}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {invoice.invoice_type} • {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${invoice.total_amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : invoice.payment_status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.payment_status}
                      </span>
                    </div>
                    <Link
                      href={`/apps/property-management/invoices/${invoice.id}`}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

