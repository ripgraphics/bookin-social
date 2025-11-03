import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost } from "@/app/utils/pms-access";
import PropertiesClient from "./PropertiesClient";

export const metadata = {
  title: "My Properties - BOOKIN.social",
  description: "Manage your properties and assignments",
};

export default async function PropertiesPage() {
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

  return <PropertiesClient currentUser={currentUser} isOwner={isOwner} isHostUser={isHostUser || isCoHostUser} />;
}

