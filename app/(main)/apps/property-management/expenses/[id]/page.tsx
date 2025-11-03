import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost } from "@/app/utils/pms-access";
import ExpenseDetailsClient from "./ExpenseDetailsClient";

interface ExpenseDetailsPageProps {
  params: { id: string };
}

export const metadata = {
  title: "Expense Details - BOOKIN.social",
  description: "View expense details",
};

export default async function ExpenseDetailsPage({ params }: ExpenseDetailsPageProps) {
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

  return (
    <ExpenseDetailsClient 
      currentUser={currentUser} 
      expenseId={params.id}
      isOwner={isOwner}
      isHost={isHostUser || isCoHostUser}
    />
  );
}

