import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isPropertyOwner } from "@/app/utils/pms-access";
import StatementsClient from "./StatementsClient";

export const metadata = {
  title: "Financial Statements - BOOKIN.social",
  description: "View financial statements",
};

export default async function StatementsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only property owners can view statements
  const isOwner = await isPropertyOwner(currentUser.id);
  if (!isOwner) {
    redirect("/apps/property-management");
  }

  return <StatementsClient currentUser={currentUser} />;
}

