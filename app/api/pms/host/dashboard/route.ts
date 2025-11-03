import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pms/host/dashboard
// Get dashboard data for hosts and co-hosts
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

    // Get assigned properties
    const { data: assignments, error: assignmentsError } = await supabase
      .from("property_assignments")
      .select(`
        id,
        property_id,
        role,
        commission_rate,
        status,
        property_management!inner(
          listing_id,
          listings(title)
        )
      `)
      .eq("user_id", publicUser.id)
      .eq("status", "active");

    if (assignmentsError) {
      console.error("[GET /api/pms/host/dashboard] Assignments error:", assignmentsError);
    }

    const assignedPropertyIds = assignments?.map(a => a.property_id) || [];

    // Get total commissions from paid invoices
    const { data: commissionData } = await supabase
      .from("invoices_v2")
      .select("total_amount")
      .eq("issued_by", publicUser.id)
      .eq("invoice_type", "operational")
      .eq("payment_status", "paid");

    const totalCommissions = commissionData?.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0) || 0;

    // Get pending invoices count
    const { data: pendingInvoices } = await supabase
      .from("invoices_v2")
      .select("id")
      .eq("issued_by", publicUser.id)
      .in("payment_status", ["unpaid", "partial"]);

    // Get submitted expenses count
    const { data: submittedExpenses } = await supabase
      .from("property_expenses")
      .select("id")
      .eq("submitted_by", publicUser.id);

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
      .eq("issued_by", publicUser.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Format assignments for display
    const recentAssignments = assignments?.map(a => ({
      id: a.id,
      property_id: a.property_id,
      role: a.role,
      commission_rate: a.commission_rate,
      status: a.status,
      property: {
        title: a.property_management?.listings?.title || 'Property'
      }
    })) || [];

    return NextResponse.json({
      assignedProperties: assignments?.length || 0,
      totalCommissions: Math.round(totalCommissions),
      pendingInvoices: pendingInvoices?.length || 0,
      submittedExpenses: submittedExpenses?.length || 0,
      recentAssignments: recentAssignments.slice(0, 5),
      recentInvoices: recentInvoices || []
    });
  } catch (error: any) {
    console.error("[GET /api/pms/host/dashboard] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

