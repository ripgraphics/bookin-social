import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/payments
// Create a payment for an invoice
export async function POST(request: Request) {
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
    const {
      invoice_id,
      payment_method,
      payment_gateway_id,
      amount,
      currency,
      payment_date,
      notes
    } = body;

    // Validate required fields
    if (!invoice_id) {
      return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
    }

    if (!payment_method || !['stripe', 'paypal', 'bank_transfer', 'cash', 'check', 'other'].includes(payment_method)) {
      return NextResponse.json({ 
        error: "payment_method is required and must be valid" 
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "amount is required and must be positive" }, { status: 400 });
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices_v2")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify user is the invoice recipient
    if (invoice.issued_to !== publicUser.id) {
      return NextResponse.json({ 
        error: "You can only make payments for invoices issued to you" 
      }, { status: 403 });
    }

    // Check if invoice is already paid
    if (invoice.payment_status === 'paid') {
      return NextResponse.json({ 
        error: "Invoice is already fully paid" 
      }, { status: 400 });
    }

    // Check if payment amount exceeds amount due
    if (amount > invoice.amount_due) {
      return NextResponse.json({ 
        error: "Payment amount exceeds amount due" 
      }, { status: 400 });
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id,
        payment_method,
        payment_gateway_id,
        amount,
        currency: currency || invoice.currency,
        payment_date: payment_date || new Date().toISOString(),
        processed_date: new Date().toISOString(),
        status: 'completed',
        payer_id: publicUser.id,
        payer_name: invoice.customer_name,
        payer_email: invoice.customer_email,
        notes,
        created_by: publicUser.id
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[POST /api/payments] Error:", paymentError);
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    // Update invoice amounts
    const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(amount);
    const newAmountDue = parseFloat(invoice.total_amount) - newAmountPaid;
    
    let newPaymentStatus = 'unpaid';
    let newStatus = invoice.status;
    
    if (newAmountDue <= 0) {
      newPaymentStatus = 'paid';
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'partial';
    }

    const { error: updateError } = await supabase
      .from("invoices_v2")
      .update({
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        payment_status: newPaymentStatus,
        status: newStatus,
        paid_date: newPaymentStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", invoice_id);

    if (updateError) {
      console.error("[POST /api/payments] Invoice update error:", updateError);
      // Don't fail the request if invoice update fails
    }

    // Create financial transaction
    const { error: transactionError } = await supabase
      .from("financial_transactions")
      .insert({
        property_id: invoice.property_id,
        transaction_type: 'income',
        amount,
        currency: currency || invoice.currency,
        source_type: 'payment',
        source_id: payment.id,
        from_user_id: publicUser.id,
        to_user_id: invoice.issued_by,
        description: `Payment for invoice ${invoice.invoice_number}`,
        transaction_date: new Date().toISOString(),
        status: 'completed'
      });

    if (transactionError) {
      console.error("[POST /api/payments] Transaction creation error:", transactionError);
      // Don't fail the request if transaction record creation fails
    }

    // TODO: Send payment confirmation email
    // This will be implemented in Phase 2 with email automation

    return NextResponse.json({
      success: true,
      payment,
      message: "Payment recorded successfully"
    });
  } catch (error: any) {
    console.error("[POST /api/payments] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

