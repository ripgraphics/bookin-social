import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost, getPMSRole } from "@/app/utils/pms-access";
import InvoiceDetailsClient from "./InvoiceDetailsClient";

interface InvoiceDetailsPageProps {
  params: { id: string };
}

export const metadata = {
  title: "Invoice Details - BOOKIN.social",
  description: "View invoice details",
};

export default async function InvoiceDetailsPage({ params }: InvoiceDetailsPageProps) {
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

  return (
    <InvoiceDetailsClient 
      currentUser={currentUser} 
      invoiceId={params.id}
      isOwner={isOwner}
      isHost={isHostUser || isCoHostUser}
      isGuest={pmsRole === 'guest'}
    />
  );
}

