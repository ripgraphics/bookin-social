import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost, getPMSRole } from "@/app/utils/pms-access";
import InvoicesClient from "./InvoicesClient";

export const metadata = {
  title: "Invoices - BOOKIN.social",
  description: "Manage your invoices",
};

export default async function InvoicesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Get user's PMS roles
  const [isOwner, isHostUser, isCoHostUser, pmsRole] = await Promise.all([
    isPropertyOwner(currentUser.id),
    isHost(currentUser.id),
    isCoHost(currentUser.id),
    getPMSRole(currentUser.id)
  ]);

  // Only allow access if user has any PMS role
  if (!isOwner && !isHostUser && !isCoHostUser && pmsRole !== 'guest') {
    redirect("/apps/property-management");
  }

  return <InvoicesClient currentUser={currentUser} isOwner={isOwner} isHost={isHostUser || isCoHostUser} />;
}

