import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/invoices/v2/:id/pdf
// Generate and download invoice PDF
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Get invoice with all details
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices_v2")
      .select(`
        *,
        property_management (
          id,
          listings (
            id,
            title,
            description,
            address_line1,
            address_line2,
            city,
            state_province,
            postal_code,
            country
          )
        ),
        issued_by_user:users!issued_by (
          id,
          first_name,
          last_name,
          email
        ),
        issued_to_user:users!issued_to (
          id,
          first_name,
          last_name,
          email
        ),
        invoice_line_items (
          id,
          item_type,
          description,
          quantity,
          unit_price,
          tax_rate,
          tax_amount,
          discount_amount,
          total_amount,
          position
        )
      `)
      .eq("id", params.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify user has access to this invoice
    if (invoice.issued_by !== publicUser.id && invoice.issued_to !== publicUser.id) {
      return NextResponse.json({ error: "You do not have access to this invoice" }, { status: 403 });
    }

    // TODO: Generate PDF using jsPDF or similar library
    // For now, return invoice data in JSON format
    // PDF generation will be implemented in Phase 2

    return NextResponse.json({
      message: "PDF generation will be implemented in Phase 2",
      invoice_data: invoice,
      download_url: null
    });
  } catch (error: any) {
    console.error("[GET /api/invoices/v2/:id/pdf] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

