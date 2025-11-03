'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import { FileText, PlusCircle, AlertCircle, Eye, Filter, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ExpensesClientProps {
  currentUser: SafeUser;
  isOwner: boolean;
  isHost: boolean;
}

interface Expense {
  id: string;
  property_id: string;
  description: string;
  amount: string;
  category: string;
  expense_date: string;
  status: string;
  receipt_url?: string;
  submitted_by: string;
  property?: {
    title: string;
  };
  submitted_by_user?: {
    firstName: string;
    lastName: string;
  };
}

export default function ExpensesClient({ currentUser, isOwner, isHost }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const fetchExpenses = async () => {
    try {
      const params = filter !== 'all' ? { filter } : {};
      const response = await axios.get('/api/expenses', { params });
      setExpenses(response.data);
    } catch (error: any) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (expenseId: string) => {
    try {
      await axios.post(`/api/expenses/${expenseId}/approve`);
      toast.success('Expense approved successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Failed to approve expense:', error);
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (expenseId: string) => {
    try {
      await axios.post(`/api/expenses/${expenseId}/reject`);
      toast.success('Expense rejected successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Failed to reject expense:', error);
      toast.error('Failed to reject expense');
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
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">View and manage property expenses</p>
        </div>
        {isHost && (
          <Link
            href="/apps/property-management/expenses/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Submit Expense</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
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

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Expenses Found</h3>
              <p className="text-gray-500">
                {filter !== 'all' 
                  ? `No ${filter} expenses found.` 
                  : 'You don\'t have any expenses yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {expense.description}
                      </h3>
                      <StatusBadge status={expense.status} size="sm" />
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {expense.property && <p>Property: {expense.property.title}</p>}
                      <p>Category: {expense.category}</p>
                      <p>Date: {new Date(expense.expense_date).toLocaleDateString()}</p>
                      {expense.submitted_by_user && !isHost && (
                        <p>Submitted by: {expense.submitted_by_user.firstName} {expense.submitted_by_user.lastName}</p>
                      )}
                      {expense.receipt_url && (
                        <a 
                          href={expense.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(expense.amount).toFixed(2)}
                    </p>
                    <div className="flex space-x-2">
                      {isOwner && expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(expense.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      <Link
                        href={`/apps/property-management/expenses/${expense.id}`}
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

