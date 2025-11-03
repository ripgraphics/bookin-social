import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { isHost, isCoHost } from "@/app/utils/pms-access";
import InvoiceForm from "@/app/components/property-management/InvoiceForm";

interface EditInvoicePageProps {
  params: { id: string };
}

export const metadata = {
  title: "Edit Invoice - BOOKIN.social",
  description: "Edit invoice details",
};

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Only hosts and co-hosts can edit invoices
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="text-gray-500 mt-1">Update invoice details</p>
      </div>
      <InvoiceForm currentUser={currentUser} invoiceId={params.id} />
    </div>
  );
}

