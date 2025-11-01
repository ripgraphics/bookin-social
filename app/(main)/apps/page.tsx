import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import AppsClient from "./AppsClient";

export const metadata = {
  title: "My Apps - Bookin",
  description: "Access all your applications in one place",
};

export default async function AppsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <AppsClient currentUser={currentUser} />;
}

