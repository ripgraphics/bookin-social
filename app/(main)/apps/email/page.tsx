import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import EmailClient from "@/app/(admin)/admin/apps/email/EmailClient";

export const metadata = {
  title: "Email - Bookin",
  description: "Manage your emails",
};

export default async function UserEmailPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <EmailClient currentUser={currentUser} isAdmin={false} />;
}

