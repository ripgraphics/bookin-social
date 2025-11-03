'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import { FileText, AlertCircle, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface StatementsClientProps {
  currentUser: SafeUser;
}

interface Statement {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  propertyCount: number;
  revenueByProperty?: Array<{
    propertyId: string;
    propertyTitle: string;
    revenue: number;
    expenses: number;
    net: number;
  }>;
}

export default function StatementsClient({ currentUser }: StatementsClientProps) {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    fetchStatements();
  }, [selectedPeriod]);

  const fetchStatements = async () => {
    try {
      const params = selectedPeriod !== 'all' ? { period: selectedPeriod } : {};
      const response = await axios.get('/api/pms/owner/statements', { params });
      setStatements(response.data);
    } catch (error: any) {
      console.error('Failed to fetch statements:', error);
      toast.error('Failed to load financial statements');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Statements</h1>
          <p className="text-gray-500 mt-1">View your property financial overview</p>
        </div>
        <div className="flex space-x-2">
          {['all', 'monthly', 'quarterly', 'yearly'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Statements List */}
      {statements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Statements Found</h3>
              <p className="text-gray-500">Financial statements will appear here once you have transactions.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {statements.map((statement, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{statement.period}</CardTitle>
                    <CardDescription>
                      {statement.propertyCount} properties • {new Date().toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${statement.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${statement.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Net Income</p>
                    <p className={`text-2xl font-bold ${statement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${statement.netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Revenue by Property */}
                {statement.revenueByProperty && statement.revenueByProperty.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Revenue by Property</h4>
                    <div className="space-y-3">
                      {statement.revenueByProperty.map((prop, propIndex) => (
                        <div
                          key={propIndex}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{prop.propertyTitle}</p>
                            <p className="text-sm text-gray-500">
                              Revenue: ${prop.revenue.toLocaleString()} • 
                              Expenses: ${prop.expenses.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${prop.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${prop.net.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

