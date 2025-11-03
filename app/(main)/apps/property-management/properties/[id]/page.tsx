import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost } from "@/app/utils/pms-access";
import PropertyDetailsClient from "./PropertyDetailsClient";

export const metadata = {
  title: "Property Details - BOOKIN.social",
  description: "View property management details",
};

interface PropertyDetailsPageProps {
  params: { id: string };
}

export default async function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Get user's PMS roles
  const [isOwner, isHostUser, isCoHostUser] = await Promise.all([
    isPropertyOwner(currentUser.id),
    isHost(currentUser.id),
    isCoHost(currentUser.id)
  ]);

  // Only allow access if user has any PMS role
  if (!isOwner && !isHostUser && !isCoHostUser) {
    redirect("/apps/property-management");
  }

  return <PropertyDetailsClient currentUser={currentUser} propertyId={params.id} isOwner={isOwner} />;
}

