'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import { CreditCard, AlertCircle, Download, Receipt } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PaymentsClientProps {
  currentUser: SafeUser;
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: string;
  payment_method: string;
  payment_date: string;
  transaction_id?: string;
  invoice?: {
    invoice_number: string;
    invoice_type: string;
    property?: {
      title: string;
    };
  };
}

export default function PaymentsClient({ currentUser }: PaymentsClientProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/payments');
      setPayments(response.data);
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="list" itemCount={6} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-500 mt-1">View all your payments</p>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-500">You don't have any payments yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.invoice ? `Invoice #${payment.invoice.invoice_number}` : 'Payment'}
                      </h3>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {payment.invoice?.property && (
                        <p>Property: {payment.invoice.property.title}</p>
                      )}
                      {payment.invoice?.invoice_type && (
                        <p>Type: {payment.invoice.invoice_type}</p>
                      )}
                      <p>Method: {payment.payment_method}</p>
                      <p>Date: {new Date(payment.payment_date).toLocaleDateString()}</p>
                      {payment.transaction_id && (
                        <p>Transaction ID: {payment.transaction_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <p className="text-2xl font-bold text-green-600">
                      ${parseFloat(payment.amount).toFixed(2)}
                    </p>
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

