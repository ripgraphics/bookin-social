import getCurrentUser from "@/app/actions/getCurrentUser";
import BlogClient from "./BlogClient";

export default async function BlogPage() {
  const currentUser = await getCurrentUser();
  
  return <BlogClient currentUser={currentUser} />;
}
