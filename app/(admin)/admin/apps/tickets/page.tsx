import getCurrentUser from "@/app/actions/getCurrentUser";
import TicketsClient from "./TicketsClient";

export default async function TicketsPage() {
  const currentUser = await getCurrentUser();
  
  return <TicketsClient currentUser={currentUser} />;
}
