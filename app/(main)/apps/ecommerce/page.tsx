import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import EcommerceClient from "@/app/(admin)/admin/apps/ecommerce/EcommerceClient";

export const metadata = {
  title: "eCommerce - Bookin",
  description: "Browse and purchase products",
};

export default async function UserEcommercePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <EcommerceClient currentUser={currentUser} isAdmin={false} />;
}

