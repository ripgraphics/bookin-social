import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/invoices/v2/:id/send
// Send invoice to recipient
export async function POST(
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

    // Verify ownership
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices_v2")
      .select(`
        *,
        issued_to_user:users!issued_to (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", params.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.issued_by !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this invoice" }, { status: 403 });
    }

    // Can only send draft invoices
    if (invoice.status !== 'draft') {
      return NextResponse.json({ 
        error: "Invoice has already been sent" 
      }, { status: 400 });
    }

    // Update invoice status to sent
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices_v2")
      .update({
        status: 'sent',
        sent_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: publicUser.id
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("[POST /api/invoices/v2/:id/send] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // TODO: Send email notification to recipient
    // This will be implemented in Phase 2 with email automation
    // For now, we just update the status

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: "Invoice sent successfully"
    });
  } catch (error: any) {
    console.error("[POST /api/invoices/v2/:id/send] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

