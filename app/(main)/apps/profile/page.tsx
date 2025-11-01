import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import getProfilePageData from "@/app/actions/getProfilePageData";
import ProfileClient from "@/app/(admin)/admin/apps/profile/ProfileClient";

export const metadata = {
  title: "My Profile - Bookin",
  description: "Manage your profile settings",
};

export default async function UserProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  // Fetch all profile data server-side to eliminate duplicate API calls
  const profileData = await getProfilePageData();

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  return <ProfileClient initialData={profileData} />;
}

