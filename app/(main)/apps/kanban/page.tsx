import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import KanbanClient from "@/app/(admin)/admin/apps/kanban/KanbanClient";

export const metadata = {
  title: "Kanban - Bookin",
  description: "Manage tasks and projects",
};

export default async function UserKanbanPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <KanbanClient currentUser={currentUser} isAdmin={false} />;
}

