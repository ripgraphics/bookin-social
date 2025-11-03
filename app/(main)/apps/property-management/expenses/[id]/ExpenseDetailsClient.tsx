'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import { FileText, ArrowLeft, AlertCircle, Download, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ExpenseDetailsClientProps {
  currentUser: SafeUser;
  expenseId: string;
  isOwner: boolean;
  isHost: boolean;
}

interface ExpenseDetails {
  id: string;
  property_id: string;
  description: string;
  amount: string;
  category: string;
  expense_date: string;
  status: string;
  receipt_url?: string;
  notes?: string;
  submitted_by: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  property?: {
    title: string;
  };
  submitted_by_user?: {
    firstName: string;
    lastName: string;
  };
  reviewed_by_user?: {
    firstName: string;
    lastName: string;
  };
}

export default function ExpenseDetailsClient({ currentUser, expenseId, isOwner, isHost }: ExpenseDetailsClientProps) {
  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchExpenseDetails();
  }, [expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      const response = await axios.get(`/api/expenses/${expenseId}`);
      setExpense(response.data);
    } catch (error: any) {
      console.error('Failed to fetch expense details:', error);
      toast.error('Failed to load expense details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await axios.post(`/api/expenses/${expenseId}/approve`);
      toast.success('Expense approved successfully');
      fetchExpenseDetails();
    } catch (error) {
      console.error('Failed to approve expense:', error);
      toast.error('Failed to approve expense');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await axios.post(`/api/expenses/${expenseId}/reject`);
      toast.success('Expense rejected successfully');
      fetchExpenseDetails();
    } catch (error) {
      console.error('Failed to reject expense:', error);
      toast.error('Failed to reject expense');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (!expense) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Expense Not Found</h3>
          <p className="text-gray-500 mb-4">The expense you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/apps/property-management/expenses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Expenses
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
            href="/apps/property-management/expenses"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{expense.description}</h1>
            <p className="text-gray-500 mt-1">
              {expense.property?.title || 'Property'} • {expense.category}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <StatusBadge status={expense.status} size="default" />
          {isOwner && expense.status === 'pending' && (
            <div className="flex space-x-2">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expense Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${parseFloat(expense.amount).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusBadge status={expense.status} size="default" />
          </CardContent>
        </Card>
        {expense.receipt_url && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receipt</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <a
                href={expense.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Download Receipt</span>
              </a>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expense Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Description</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Category</span>
              <span className="font-medium capitalize">{expense.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="font-medium">
                {new Date(expense.expense_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="font-medium">${parseFloat(expense.amount).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <StatusBadge status={expense.status} size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expense.property && (
              <div>
                <span className="text-sm text-gray-500">Property</span>
                <p className="font-medium">{expense.property.title}</p>
              </div>
            )}
            {expense.submitted_by_user && (
              <div>
                <span className="text-sm text-gray-500">Submitted By</span>
                <p className="font-medium">
                  {expense.submitted_by_user.firstName} {expense.submitted_by_user.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(expense.submitted_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {expense.reviewed_by_user && (
              <div>
                <span className="text-sm text-gray-500">Reviewed By</span>
                <p className="font-medium">
                  {expense.reviewed_by_user.firstName} {expense.reviewed_by_user.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {expense.reviewed_at && new Date(expense.reviewed_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receipt Preview */}
      {expense.receipt_url && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={expense.receipt_url}
                alt="Expense Receipt"
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {expense.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

