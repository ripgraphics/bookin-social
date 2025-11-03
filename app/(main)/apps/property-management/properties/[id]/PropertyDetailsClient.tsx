'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import { Building2, Users, DollarSign, FileText, Calendar, ArrowLeft, Edit, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PropertyDetailsClientProps {
  currentUser: SafeUser;
  propertyId: string;
  isOwner: boolean;
}

interface PropertyDetails {
  id: string;
  listing_id: string;
  owner_id: string;
  management_type: string;
  management_start_date: string;
  management_end_date?: string;
  is_active: boolean;
  property?: {
    title: string;
    description: string;
    image_src: string;
    location_value: string;
  };
  assignments?: any[];
  totalRevenue?: number;
  totalExpenses?: number;
  recentInvoices?: any[];
  recentExpenses?: any[];
}

export default function PropertyDetailsClient({ currentUser, propertyId, isOwner }: PropertyDetailsClientProps) {
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await axios.get(`/api/properties/management/${propertyId}`);
      setProperty(response.data);
    } catch (error: any) {
      console.error('Failed to fetch property details:', error);
      toast.error('Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (!property) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Property Not Found</h3>
          <p className="text-gray-500 mb-4">The property you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/apps/property-management/properties"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Properties
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
            href="/apps/property-management/properties"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {property.property?.title || 'Property'}
            </h1>
            <p className="text-gray-500 mt-1">{property.property?.location_value || 'No location'}</p>
          </div>
        </div>
        {isOwner && (
          <Link
            href={`/apps/property-management/properties/${propertyId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Property</span>
          </Link>
        )}
      </div>

      {/* Property Image */}
      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
        {property.property?.image_src ? (
          <img
            src={property.property.image_src}
            alt={property.property.title || 'Property'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-32 w-32 text-gray-400" />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Management Status</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusBadge status={property.is_active ? 'active' : 'inactive'} size="default" />
          </CardContent>
        </Card>
        {property.totalRevenue !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(property.totalRevenue || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
        {property.totalExpenses !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(property.totalExpenses || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Property Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Management Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Management Type</span>
              <span className="font-medium">{property.management_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Start Date</span>
              <span className="font-medium">
                {new Date(property.management_start_date).toLocaleDateString()}
              </span>
            </div>
            {property.management_end_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">End Date</span>
                <span className="font-medium">
                  {new Date(property.management_end_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Team */}
        {property.assignments && property.assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {property.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{assignment.user?.firstName} {assignment.user?.lastName}</p>
                        <p className="text-sm text-gray-500 capitalize">{assignment.role}</p>
                      </div>
                    </div>
                    {assignment.status === 'active' && (
                      <StatusBadge status="active" size="sm" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Invoices */}
      {property.recentInvoices && property.recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest invoices for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {property.recentInvoices.map((invoice: any) => (
                <Link
                  key={invoice.id}
                  href={`/apps/property-management/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500">{invoice.invoice_type}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">${invoice.total_amount}</span>
                    <StatusBadge status={invoice.payment_status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {property.recentExpenses && property.recentExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest expenses for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {property.recentExpenses.map((expense: any) => (
                <Link
                  key={expense.id}
                  href={`/apps/property-management/expenses/${expense.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-gray-500">{expense.category}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">${expense.amount}</span>
                    <StatusBadge status={expense.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

