import getCurrentUser from "@/app/actions/getCurrentUser";
import InvoiceClient from "./InvoiceClient";

export default async function InvoicePage() {
  const currentUser = await getCurrentUser();
  
  return <InvoiceClient currentUser={currentUser} />;
}
