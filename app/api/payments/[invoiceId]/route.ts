import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/payments/:invoiceId
// Get all payments for an invoice
export async function GET(
  request: Request,
  { params }: { params: { invoiceId: string } }
) {
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

    // Verify user has access to this invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices_v2")
      .select("issued_by, issued_to")
      .eq("id", params.invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.issued_by !== publicUser.id && invoice.issued_to !== publicUser.id) {
      return NextResponse.json({ 
        error: "You do not have access to this invoice" 
      }, { status: 403 });
    }

    // Get payments for this invoice
    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        payer:users!payer_id (
          id,
          first_name,
          last_name,
          email
        ),
        created_by_user:users!created_by (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("invoice_id", params.invoiceId)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("[GET /api/payments/:invoiceId] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(payments || []);
  } catch (error: any) {
    console.error("[GET /api/payments/:invoiceId] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

