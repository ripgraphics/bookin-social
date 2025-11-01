import getCurrentUser from "@/app/actions/getCurrentUser";
import EcommerceClient from "./EcommerceClient";

export default async function EcommercePage() {
  const currentUser = await getCurrentUser();
  
  return <EcommerceClient currentUser={currentUser} />;
}
