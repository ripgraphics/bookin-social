import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pms/guest/dashboard
// Get dashboard data for guests
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

    // Get all rental invoices for this guest
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices_v2")
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        amount_due,
        payment_status,
        due_date,
        created_at,
        property_id,
        property_management!inner(
          listing_id,
          listings(title)
        )
      `)
      .eq("issued_to", publicUser.id)
      .eq("invoice_type", "rental")
      .order("created_at", { ascending: false });

    if (invoicesError) {
      console.error("[GET /api/pms/guest/dashboard] Invoices error:", invoicesError);
    }

    // Calculate totals
    const totalInvoices = invoices?.length || 0;
    const totalPaid = invoices?.reduce((sum, inv) => 
      sum + (inv.payment_status === 'paid' ? parseFloat(inv.total_amount) : 0), 0) || 0;
    const totalPending = invoices?.reduce((sum, inv) => 
      sum + (inv.payment_status !== 'paid' ? parseFloat(inv.amount_due) : 0), 0) || 0;

    // Get upcoming reservations
    const { data: upcomingReservations } = await supabase
      .from("reservations")
      .select(`
        id,
        start_date,
        end_date,
        listing_id,
        listings(title)
      `)
      .eq("user_id", publicUser.id)
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(5);

    // Format invoices for display
    const recentInvoices = invoices?.slice(0, 10).map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      total_amount: parseFloat(inv.total_amount),
      amount_due: parseFloat(inv.amount_due),
      payment_status: inv.payment_status,
      due_date: inv.due_date,
      created_at: inv.created_at,
      property: {
        title: inv.property_management?.listings?.title || 'Property'
      }
    })) || [];

    return NextResponse.json({
      totalInvoices,
      totalPaid: Math.round(totalPaid),
      totalPending: Math.round(totalPending),
      upcomingReservations: upcomingReservations?.length || 0,
      recentInvoices,
      upcomingReservationsList: upcomingReservations || []
    });
  } catch (error: any) {
    console.error("[GET /api/pms/guest/dashboard] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

