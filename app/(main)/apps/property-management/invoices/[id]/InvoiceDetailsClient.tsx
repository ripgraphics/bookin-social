'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import { Receipt, ArrowLeft, AlertCircle, Download, Send, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface InvoiceDetailsClientProps {
  currentUser: SafeUser;
  invoiceId: string;
  isOwner: boolean;
  isHost: boolean;
  isGuest: boolean;
}

interface InvoiceDetails {
  id: string;
  invoice_number: string;
  invoice_type: string;
  property_id: string;
  issued_to: string;
  issued_by: string;
  issue_date: string;
  due_date: string;
  payment_status: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  notes?: string;
  line_items: any[];
  property?: {
    title: string;
  };
  issued_to_user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  issued_by_user?: {
    firstName: string;
    lastName: string;
  };
}

export default function InvoiceDetailsClient({ currentUser, invoiceId, isOwner, isHost, isGuest }: InvoiceDetailsClientProps) {
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    try {
      const response = await axios.get(`/api/invoices/v2/${invoiceId}`);
      setInvoice(response.data);
    } catch (error: any) {
      console.error('Failed to fetch invoice details:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      setIsProcessing(true);
      const response = await axios.get(`/api/invoices/v2/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      setIsProcessing(true);
      await axios.post(`/api/invoices/v2/${invoiceId}/send`);
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      toast.error('Failed to send invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Not Found</h3>
          <p className="text-gray-500 mb-4">The invoice you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/apps/property-management/invoices"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/apps/property-management/invoices"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice #{invoice.invoice_number}
            </h1>
            <p className="text-gray-500 mt-1">
              {invoice.property?.title || 'Property'} • {invoice.invoice_type}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <StatusBadge status={invoice.payment_status} size="default" />
          {invoice.payment_status === 'paid' && (
            <button
              onClick={handleDownloadReceipt}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Receipt</span>
            </button>
          )}
          {(isHost || isOwner) && invoice.payment_status === 'unpaid' && (
            <button
              onClick={handleSendInvoice}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(invoice.total_amount).toFixed(2)}</div>
          </CardContent>
        </Card>
        {parseFloat(invoice.amount_paid) > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${parseFloat(invoice.amount_paid).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}
        {parseFloat(invoice.amount_due) > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${parseFloat(invoice.amount_due).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Invoice Number</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Invoice Type</span>
              <span className="font-medium capitalize">{invoice.invoice_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Issue Date</span>
              <span className="font-medium">
                {new Date(invoice.issue_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Due Date</span>
              <span className="font-medium">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Payment Status</span>
              <StatusBadge status={invoice.payment_status} size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.property && (
              <div>
                <span className="text-sm text-gray-500">Property</span>
                <p className="font-medium">{invoice.property.title}</p>
              </div>
            )}
            {invoice.issued_to_user && (
              <div>
                <span className="text-sm text-gray-500">Issued To</span>
                <p className="font-medium">{invoice.issued_to_user.firstName} {invoice.issued_to_user.lastName}</p>
                <p className="text-sm text-gray-500">{invoice.issued_to_user.email}</p>
              </div>
            )}
            {invoice.issued_by_user && (
              <div>
                <span className="text-sm text-gray-500">Issued By</span>
                <p className="font-medium">{invoice.issued_by_user.firstName} {invoice.issued_by_user.lastName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {invoice.line_items && invoice.line_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{item.description}</td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">${parseFloat(item.unit_price).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        ${(parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right font-bold">Total</td>
                    <td className="py-3 px-4 text-right font-bold">
                      ${parseFloat(invoice.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

