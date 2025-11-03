import { redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { canAccessPMS, getPMSRole, isAdmin } from "@/app/utils/pms-access";
import OwnerDashboard from "@/app/components/property-management/frontend/OwnerDashboard";
import HostDashboard from "@/app/components/property-management/frontend/HostDashboard";
import GuestDashboard from "@/app/components/property-management/frontend/GuestDashboard";

export const metadata = {
  title: "Property Management - BOOKIN.social",
  description: "Manage your properties, invoices, and expenses",
};

export default async function PropertyManagementPage() {
  const currentUser = await getCurrentUser();

  // Check if user is logged in
  if (!currentUser) {
    redirect("/");
  }

  // If user is admin, redirect to admin PMS
  if (isAdmin(currentUser)) {
    redirect("/admin/apps/property-management");
  }

  // Check if user has PMS access
  const hasAccess = await canAccessPMS(currentUser);
  if (!hasAccess) {
    redirect("/");
  }

  // Get user's primary PMS role
  const pmsRole = await getPMSRole(currentUser.id);

  // Render appropriate dashboard based on role
  switch (pmsRole) {
    case 'owner':
      return <OwnerDashboard currentUser={currentUser} />;
    case 'host':
    case 'co_host':
      return <HostDashboard currentUser={currentUser} role={pmsRole} />;
    case 'guest':
      return <GuestDashboard currentUser={currentUser} />;
    default:
      // Shouldn't reach here, but redirect to home if no role found
      redirect("/");
  }
}

