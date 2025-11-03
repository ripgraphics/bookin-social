import { Suspense } from 'react';
import PropertyForm from '@/app/components/property-management/PropertyForm';
import LoadingSkeleton from '@/app/components/property-management/shared/LoadingSkeleton';
import getPropertyById from '@/app/actions/getPropertyById';

async function getProperty(propertyId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/properties/management/${propertyId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

async function EditPropertyContent({ propertyId }: { propertyId: string }) {
  const property = await getProperty(propertyId);

  if (!property) {
    return (
      <div className="text-center py-12">
        <h3 className="text-sm font-medium text-gray-900">Property not found</h3>
      </div>
    );
  }

  return <PropertyForm property={property} />;
}

export default async function EditPropertyPage({
  params
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit Property
        </h1>
        <p className="text-gray-600">
          Update property management settings.
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton type="form" count={10} />}>
        <EditPropertyContent propertyId={params.id} />
      </Suspense>
    </div>
  );
}

