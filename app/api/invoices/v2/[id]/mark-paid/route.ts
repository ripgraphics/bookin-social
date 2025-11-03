import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/invoices/v2/:id/mark-paid
// Manually mark invoice as paid
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

    const body = await request.json();
    const { payment_method, payment_date, notes } = body;

    // Verify ownership
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices_v2")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.issued_by !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this invoice" }, { status: 403 });
    }

    // Can't mark already paid invoices
    if (invoice.payment_status === 'paid') {
      return NextResponse.json({ 
        error: "Invoice is already marked as paid" 
      }, { status: 400 });
    }

    // Update invoice to paid
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("invoices_v2")
      .update({
        status: 'paid',
        payment_status: 'paid',
        amount_paid: invoice.total_amount,
        amount_due: 0,
        paid_date: payment_date || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
        updated_by: publicUser.id
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("[POST /api/invoices/v2/:id/mark-paid] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: params.id,
        payment_method: payment_method || 'other',
        amount: invoice.total_amount,
        currency: invoice.currency,
        payment_date: payment_date || new Date().toISOString(),
        processed_date: new Date().toISOString(),
        status: 'completed',
        payer_id: invoice.issued_to,
        payer_name: invoice.customer_name,
        payer_email: invoice.customer_email,
        notes: notes || 'Manually marked as paid',
        created_by: publicUser.id
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[POST /api/invoices/v2/:id/mark-paid] Payment creation error:", paymentError);
      // Don't fail the request if payment record creation fails
    }

    // Create financial transaction
    const { error: transactionError } = await supabase
      .from("financial_transactions")
      .insert({
        property_id: invoice.property_id,
        transaction_type: 'income',
        amount: invoice.total_amount,
        currency: invoice.currency,
        source_type: 'invoice',
        source_id: params.id,
        from_user_id: invoice.issued_to,
        to_user_id: invoice.issued_by,
        description: `Payment for invoice ${invoice.invoice_number}`,
        transaction_date: new Date().toISOString(),
        status: 'completed'
      });

    if (transactionError) {
      console.error("[POST /api/invoices/v2/:id/mark-paid] Transaction creation error:", transactionError);
      // Don't fail the request if transaction record creation fails
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      payment,
      message: "Invoice marked as paid successfully"
    });
  } catch (error: any) {
    console.error("[POST /api/invoices/v2/:id/mark-paid] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

