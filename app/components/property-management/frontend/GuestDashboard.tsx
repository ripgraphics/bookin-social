'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from '@/app/components/property-management/shared/StatCard';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import { Receipt, DollarSign, Calendar, AlertCircle, Download } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface GuestDashboardProps {
  currentUser: SafeUser;
}

interface DashboardStats {
  totalInvoices: number;
  totalPaid: number;
  totalPending: number;
  upcomingReservations: number;
  recentInvoices: any[];
  upcomingReservationsList: any[];
}

export default function GuestDashboard({ currentUser }: GuestDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/pms/guest/dashboard');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = async (invoiceId: string) => {
    try {
      const response = await axios.get(`/api/invoices/v2/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt');
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
          <p className="text-gray-500 mb-4">Unable to load your booking and payment data.</p>
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
        <h1 className="text-3xl font-bold text-gray-900">My Bookings & Payments</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {currentUser.firstName}! View your invoices and payment history.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices.toString()}
          icon={<Receipt className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total Paid"
          value={`$${stats.totalPaid.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pending Payment"
          value={`$${stats.totalPending.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
          subtitle={stats.totalPending > 0 ? "Payment due" : undefined}
        />
        <StatCard
          title="Upcoming Trips"
          value={stats.upcomingReservations.toString()}
          icon={<Calendar className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Pending Payments */}
      {stats.recentInvoices && stats.recentInvoices.filter(inv => inv.payment_status !== 'paid').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Invoices that require payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentInvoices
                .filter(invoice => invoice.payment_status !== 'paid')
                .map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        Invoice #{invoice.invoice_number}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {invoice.property?.title || 'Property'} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${invoice.amount_due.toFixed(2)}
                        </p>
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                          {invoice.payment_status}
                        </span>
                      </div>
                      <Link
                        href={`/apps/property-management/invoices/${invoice.id}`}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Pay Now
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
            <CardDescription>Your booking invoices and payment history</CardDescription>
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
                      {invoice.property?.title || 'Property'} • {new Date(invoice.created_at).toLocaleDateString()}
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
                    <div className="flex space-x-2">
                      {invoice.payment_status === 'paid' && (
                        <button
                          onClick={() => handleDownloadReceipt(invoice.id)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>Receipt</span>
                        </button>
                      )}
                      <Link
                        href={`/apps/property-management/invoices/${invoice.id}`}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Reservations */}
      {stats.upcomingReservationsList && stats.upcomingReservationsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
            <CardDescription>Your confirmed reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingReservationsList.map((reservation: any) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {reservation.listing?.title || 'Property'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(reservation.start_date).toLocaleDateString()} - {new Date(reservation.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/listings/${reservation.listing_id}`}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View Property
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

