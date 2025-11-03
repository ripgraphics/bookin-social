'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import { Receipt, PlusCircle, AlertCircle, Download, Eye, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface InvoicesClientProps {
  currentUser: SafeUser;
  isOwner: boolean;
  isHost: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  payment_status: string;
  due_date: string;
  created_at: string;
  property?: {
    title: string;
  };
  issued_by_user?: {
    firstName: string;
    lastName: string;
  };
}

export default function InvoicesClient({ currentUser, isOwner, isHost }: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      const params = filter !== 'all' ? { filter } : {};
      const response = await axios.get('/api/invoices/v2', { params });
      setInvoices(response.data);
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
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
    return <LoadingSkeleton type="list" itemCount={6} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">View and manage your invoices</p>
        </div>
        {isHost && (
          <Link
            href="/apps/property-management/invoices/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create Invoice</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            {['all', 'unpaid', 'partial', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-4 w-4 inline mr-2" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
              <p className="text-gray-500">
                {filter !== 'all' 
                  ? `No ${filter} invoices found.` 
                  : 'You don\'t have any invoices yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Invoice #{invoice.invoice_number}
                      </h3>
                      <StatusBadge status={invoice.payment_status} size="sm" />
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Type: {invoice.invoice_type}</p>
                      {invoice.property && <p>Property: {invoice.property.title}</p>}
                      {invoice.issued_by_user && !isHost && (
                        <p>Issued by: {invoice.issued_by_user.firstName} {invoice.issued_by_user.lastName}</p>
                      )}
                      <p>Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                      <p>Created: {new Date(invoice.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${parseFloat(invoice.total_amount).toFixed(2)}
                      </p>
                      {parseFloat(invoice.amount_due) > 0 && (
                        <p className="text-sm text-orange-600">
                          ${parseFloat(invoice.amount_due).toFixed(2)} due
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {invoice.payment_status === 'paid' && (
                        <button
                          onClick={() => handleDownloadReceipt(invoice.id)}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>Receipt</span>
                        </button>
                      )}
                      <Link
                        href={`/apps/property-management/invoices/${invoice.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

