'use client';

import { useEffect, useState } from 'react';
import { SafeUser } from '@/app/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import StatusBadge from '@/app/components/property-management/shared/StatusBadge';
import { Building2, PlusCircle, AlertCircle, MoreVertical, Edit, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PropertiesClientProps {
  currentUser: SafeUser;
  isOwner: boolean;
  isHostUser: boolean;
}

interface Property {
  id: string;
  listing_id: string;
  owner_id: string;
  management_type: string;
  management_start_date: string;
  management_end_date?: string;
  is_active: boolean;
  property?: {
    title: string;
    image_src: string;
    location_value: string;
  };
  assignments?: any[];
  role?: string;
}

export default function PropertiesClient({ currentUser, isOwner, isHostUser }: PropertiesClientProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties/management');
      setProperties(response.data);
    } catch (error: any) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to load properties');
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwner ? 'My Properties' : 'Assigned Properties'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isOwner 
              ? 'Manage your property portfolio' 
              : 'Properties you are managing'}
          </p>
        </div>
        {isOwner && (
          <Link
            href="/apps/property-management/properties/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Property</span>
          </Link>
        )}
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isOwner ? 'No Properties Yet' : 'No Assigned Properties'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isOwner 
                  ? 'Start managing your properties by adding your first property.' 
                  : 'You haven\'t been assigned to manage any properties yet.'}
              </p>
              {isOwner && (
                <Link
                  href="/apps/property-management/properties/new"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Add Your First Property</span>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                {property.property?.image_src ? (
                  <img
                    src={property.property.image_src}
                    alt={property.property.title || 'Property'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge 
                    status={property.is_active ? 'active' : 'inactive'}
                    size="sm"
                  />
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{property.property?.title || 'Property'}</CardTitle>
                <CardDescription>
                  {property.property?.location_value || 'No location'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Management Type:</span>
                    <span className="font-medium">{property.management_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Started:</span>
                    <span className="font-medium">
                      {new Date(property.management_start_date).toLocaleDateString()}
                    </span>
                  </div>
                  {property.role && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Your Role:</span>
                      <span className="font-medium capitalize">{property.role}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/apps/property-management/properties/${property.listing_id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                  {isOwner && (
                    <Link
                      href={`/apps/property-management/properties/${property.listing_id}/edit`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

