import getCurrentUser from "@/app/actions/getCurrentUser";
import KanbanClient from "./KanbanClient";

export default async function KanbanPage() {
  const currentUser = await getCurrentUser();
  
  return <KanbanClient currentUser={currentUser} />;
}
