import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import TicketsClient from "@/app/(admin)/admin/apps/tickets/TicketsClient";

export const metadata = {
  title: "Tickets - Bookin",
  description: "Submit and track support tickets",
};

export default async function UserTicketsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <TicketsClient currentUser={currentUser} isAdmin={false} />;
}

