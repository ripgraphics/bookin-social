import PropertyForm from '@/app/components/property-management/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add New Property
        </h1>
        <p className="text-gray-600">
          Configure property management settings for your listing.
        </p>
      </div>

      <PropertyForm />
    </div>
  );
}

