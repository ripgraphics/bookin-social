import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import ChatClient from "@/app/(admin)/admin/apps/chat/ChatClient";

export const metadata = {
  title: "Chat - Bookin",
  description: "Send and receive messages",
};

export default async function UserChatPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <ChatClient currentUser={currentUser} isAdmin={false} />;
}

