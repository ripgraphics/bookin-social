import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import ContactsClient from "@/app/(admin)/admin/apps/contacts/ContactsClient";

export const metadata = {
  title: "Contacts - Bookin",
  description: "Manage your contacts",
};

export default async function UserContactsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <ContactsClient currentUser={currentUser} isAdmin={false} />;
}

