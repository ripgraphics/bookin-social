import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import NotesClient from "@/app/(admin)/admin/apps/notes/NotesClient";

export const metadata = {
  title: "Notes - Bookin",
  description: "Create and organize notes",
};

export default async function UserNotesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <NotesClient currentUser={currentUser} isAdmin={false} />;
}

