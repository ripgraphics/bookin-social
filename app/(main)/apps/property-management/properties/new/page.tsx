import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner } from "@/app/utils/pms-access";
import PropertyForm from "@/app/components/property-management/PropertyForm";

export const metadata = {
  title: "Add Property - BOOKIN.social",
  description: "Add a new property to management",
};

export default async function NewPropertyPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only property owners can add properties
  const isOwner = await isPropertyOwner(currentUser.id);
  if (!isOwner) {
    redirect("/apps/property-management");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Property</h1>
        <p className="text-gray-500 mt-1">Add a new property to your management portfolio</p>
      </div>
      <PropertyForm currentUser={currentUser} />
    </div>
  );
}

