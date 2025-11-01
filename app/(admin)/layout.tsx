import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { canAccessAdminDashboard } from "@/app/utils/permissions";
import AdminSidebar from "@/app/components/admin/AdminSidebar";
import AdminHeader from "@/app/components/admin/AdminHeader";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "Admin Dashboard - Bookin",
  description: "Admin dashboard for managing Bookin platform",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  // Check if user has admin dashboard access
  if (!currentUser || !canAccessAdminDashboard(currentUser)) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar currentUser={currentUser} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader currentUser={currentUser} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

