import getCurrentUser from "@/app/actions/getCurrentUser";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const currentUser = await getCurrentUser();
  
  return <ContactsClient currentUser={currentUser} />;
}
