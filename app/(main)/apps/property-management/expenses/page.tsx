import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner, isHost, isCoHost } from "@/app/utils/pms-access";
import ExpensesClient from "./ExpensesClient";

export const metadata = {
  title: "Expenses - BOOKIN.social",
  description: "Manage property expenses",
};

export default async function ExpensesPage() {
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

  return <ExpensesClient currentUser={currentUser} isOwner={isOwner} isHost={isHostUser || isCoHostUser} />;
}

