import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import BlogClient from "@/app/(admin)/admin/apps/blog/BlogClient";

export const metadata = {
  title: "Blog - Bookin",
  description: "Read and write blog posts",
};

export default async function UserBlogPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  return <BlogClient currentUser={currentUser} isAdmin={false} />;
}

