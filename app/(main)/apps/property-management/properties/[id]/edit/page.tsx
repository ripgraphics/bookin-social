import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner } from "@/app/utils/pms-access";
import PropertyForm from "@/app/components/property-management/PropertyForm";

interface EditPropertyPageProps {
  params: { id: string };
}

export const metadata = {
  title: "Edit Property - BOOKIN.social",
  description: "Edit property management details",
};

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only property owners can edit properties
  const isOwner = await isPropertyOwner(currentUser.id);
  if (!isOwner) {
    redirect("/apps/property-management");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
        <p className="text-gray-500 mt-1">Update property management details</p>
      </div>
      <PropertyForm currentUser={currentUser} propertyId={params.id} />
    </div>
  );
}

