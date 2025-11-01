import getCurrentUser from "@/app/actions/getCurrentUser";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const currentUser = await getCurrentUser();
  return <CalendarClient currentUser={currentUser} />;
}
