import getCurrentUser from "@/app/actions/getCurrentUser";
import EmailClient from "./EmailClient";

export default async function EmailPage() {
  const currentUser = await getCurrentUser();
  return <EmailClient currentUser={currentUser} />;
}
