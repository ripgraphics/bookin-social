import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isHost, isCoHost } from "@/app/utils/pms-access";
import InvoiceForm from "@/app/components/property-management/InvoiceForm";

export const metadata = {
  title: "Create Invoice - BOOKIN.social",
  description: "Create a new operational invoice",
};

export default async function NewInvoicePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only hosts and co-hosts can create operational invoices
  const [isHostUser, isCoHostUser] = await Promise.all([
    isHost(currentUser.id),
    isCoHost(currentUser.id)
  ]);

  if (!isHostUser && !isCoHostUser) {
    redirect("/apps/property-management");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-500 mt-1">Create a new operational invoice</p>
      </div>
      <InvoiceForm currentUser={currentUser} />
    </div>
  );
}

