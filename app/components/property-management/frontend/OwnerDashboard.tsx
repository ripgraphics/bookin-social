'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from '@/app/components/property-management/shared/StatCard';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import { Building2, DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface OwnerDashboardProps {
  currentUser: SafeUser;
}

interface DashboardStats {
  totalProperties: number;
  totalRevenue: number;
  pendingExpenses: number;
  activeReservations: number;
  recentInvoices: any[];
  pendingExpensesList: any[];
}

export default function OwnerDashboard({ currentUser }: OwnerDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/pms/owner/dashboard');
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
          <p className="text-gray-500 mb-4">Unable to load your property management data.</p>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Property Owner Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {currentUser.firstName}! Here's an overview of your properties.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={stats.totalProperties.toString()}
          icon={<Building2 className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pending Expenses"
          value={stats.pendingExpenses.toString()}
          icon={<FileText className="h-6 w-6" />}
          color="orange"
          subtitle={stats.pendingExpenses > 0 ? "Needs attention" : undefined}
        />
        <StatCard
          title="Active Reservations"
          value={stats.activeReservations.toString()}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for property owners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/apps/property-management/properties"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Properties</h3>
              <p className="text-sm text-gray-500">Manage your property portfolio</p>
            </Link>
            <Link
              href="/apps/property-management/expenses"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Review Expenses</h3>
              <p className="text-sm text-gray-500">
                {stats.pendingExpenses > 0 
                  ? `${stats.pendingExpenses} pending approval` 
                  : 'No pending expenses'}
              </p>
            </Link>
            <Link
              href="/apps/property-management/statements"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Financial Statements</h3>
              <p className="text-sm text-gray-500">View monthly and quarterly reports</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pending Expenses */}
      {stats.pendingExpensesList && stats.pendingExpensesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Expense Approvals</CardTitle>
            <CardDescription>Expenses waiting for your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingExpensesList.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{expense.description}</h4>
                    <p className="text-sm text-gray-500">
                      {expense.category} • {new Date(expense.expense_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </span>
                    <Link
                      href={`/apps/property-management/expenses/${expense.id}`}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Review
                    </Link>
                  </div>
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
            <CardDescription>Latest invoices for your properties</CardDescription>
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

