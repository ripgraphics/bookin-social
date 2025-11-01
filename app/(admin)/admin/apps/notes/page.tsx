import getCurrentUser from "@/app/actions/getCurrentUser";
import NotesClient from "./NotesClient";

export default async function NotesPage() {
  const currentUser = await getCurrentUser();
  return <NotesClient currentUser={currentUser} />;
}
