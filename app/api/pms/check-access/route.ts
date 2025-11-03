import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pms/check-access
// Check if the current user has access to the Property Management System
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasAccess: false });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ hasAccess: false });
    }

    const userId = publicUser.id;

    // Check if user is a property owner
    const { data: ownedProperties } = await supabase
      .from("property_management")
      .select("id")
      .eq("owner_id", userId)
      .limit(1);

    if (ownedProperties && ownedProperties.length > 0) {
      return NextResponse.json({ hasAccess: true, role: 'owner' });
    }

    // Check if user is a host or co-host
    const { data: assignments } = await supabase
      .from("property_assignments")
      .select("id, role")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    if (assignments && assignments.length > 0) {
      return NextResponse.json({ 
        hasAccess: true, 
        role: assignments[0].role 
      });
    }

    // Check if user has any reservations (guest)
    const { data: reservations } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (reservations && reservations.length > 0) {
      return NextResponse.json({ hasAccess: true, role: 'guest' });
    }

    // No PMS access
    return NextResponse.json({ hasAccess: false });
  } catch (error: any) {
    console.error("[GET /api/pms/check-access] Error:", error);
    return NextResponse.json({ hasAccess: false });
  }
}

