import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import CalendarClient from "@/app/(admin)/admin/apps/calendar/CalendarClient";

export const metadata = {
  title: "Calendar - Bookin",
  description: "Schedule and manage events",
};

export default async function UserCalendarPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <CalendarClient currentUser={currentUser} isAdmin={false} />;
}

