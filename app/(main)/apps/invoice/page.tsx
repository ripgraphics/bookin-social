import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import InvoiceClient from "@/app/(admin)/admin/apps/invoice/InvoiceClient";

export const metadata = {
  title: "Invoice - Bookin",
  description: "Create and manage invoices",
};

export default async function UserInvoicePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <InvoiceClient currentUser={currentUser} isAdmin={false} />;
}

