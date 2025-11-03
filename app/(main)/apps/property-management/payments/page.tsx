import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost, getPMSRole } from "@/app/utils/pms-access";
import PaymentsClient from "./PaymentsClient";

export const metadata = {
  title: "Payments - BOOKIN.social",
  description: "View payment history",
};

export default async function PaymentsPage() {
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

  return <PaymentsClient currentUser={currentUser} />;
}

