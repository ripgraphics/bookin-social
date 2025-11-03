import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pms/owner/dashboard
// Get dashboard data for property owners
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get total properties owned
    const { data: properties, error: propertiesError } = await supabase
      .from("property_management")
      .select("id, listing_id")
      .eq("owner_id", publicUser.id);

    if (propertiesError) {
      console.error("[GET /api/pms/owner/dashboard] Properties error:", propertiesError);
    }

    const propertyIds = properties?.map(p => p.listing_id) || [];

    // Get total revenue from paid invoices
    const { data: revenueData } = await supabase
      .from("invoices_v2")
      .select("total_amount")
      .in("property_id", propertyIds)
      .eq("payment_status", "paid");

    const totalRevenue = revenueData?.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0) || 0;

    // Get pending expenses count
    const { data: pendingExpenses } = await supabase
      .from("property_expenses")
      .select("id, description, amount, category, expense_date")
      .in("property_id", propertyIds)
      .eq("status", "pending")
      .order("expense_date", { ascending: false })
      .limit(5);

    // Get active reservations
    const { data: activeReservations } = await supabase
      .from("reservations")
      .select("id")
      .in("listing_id", propertyIds)
      .gte("end_date", new Date().toISOString());

    // Get recent invoices
    const { data: recentInvoices } = await supabase
      .from("invoices_v2")
      .select(`
        id,
        invoice_number,
        invoice_type,
        total_amount,
        payment_status,
        created_at
      `)
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalProperties: properties?.length || 0,
      totalRevenue: Math.round(totalRevenue),
      pendingExpenses: pendingExpenses?.length || 0,
      activeReservations: activeReservations?.length || 0,
      recentInvoices: recentInvoices || [],
      pendingExpensesList: pendingExpenses || []
    });
  } catch (error: any) {
    console.error("[GET /api/pms/owner/dashboard] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

