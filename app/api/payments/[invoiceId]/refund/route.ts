import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/payments/:invoiceId/refund
// Refund a payment
export async function POST(
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

    const body = await request.json();
    const { reason, refund_amount } = body;

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        *,
        invoices_v2 (
          id,
          invoice_number,
          issued_by,
          issued_to,
          amount_paid,
          amount_due,
          total_amount
        )
      `)
      .eq("id", params.invoiceId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify user is the invoice issuer (only issuer can refund)
    if (payment.invoices_v2?.issued_by !== publicUser.id) {
      return NextResponse.json({ 
        error: "Only the invoice issuer can refund payments" 
      }, { status: 403 });
    }

    // Check if payment is already refunded
    if (payment.status === 'refunded') {
      return NextResponse.json({ 
        error: "Payment is already refunded" 
      }, { status: 400 });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return NextResponse.json({ 
        error: "Can only refund completed payments" 
      }, { status: 400 });
    }

    // Validate refund amount
    const amountToRefund = refund_amount || payment.amount;
    if (amountToRefund > payment.amount) {
      return NextResponse.json({ 
        error: "Refund amount cannot exceed payment amount" 
      }, { status: 400 });
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({
        status: 'refunded',
        notes: `${payment.notes || ''}\nRefunded: ${reason || 'No reason provided'}`,
        metadata: {
          ...payment.metadata,
          refund_date: new Date().toISOString(),
          refund_amount: amountToRefund,
          refund_reason: reason,
          refunded_by: publicUser.id
        }
      })
      .eq("id", params.invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error("[POST /api/payments/:invoiceId/refund] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update invoice amounts
    const invoice = payment.invoices_v2;
    if (invoice) {
      const newAmountPaid = parseFloat(invoice.amount_paid) - parseFloat(amountToRefund);
      const newAmountDue = parseFloat(invoice.total_amount) - newAmountPaid;
      
      let newPaymentStatus = 'unpaid';
      let newStatus = 'sent';
      
      if (newAmountDue <= 0) {
        newPaymentStatus = 'paid';
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partial';
      } else if (newAmountPaid === 0) {
        newPaymentStatus = 'refunded';
        newStatus = 'refunded';
      }

      await supabase
        .from("invoices_v2")
        .update({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          payment_status: newPaymentStatus,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.invoice_id);
    }

    // Create refund transaction
    const { error: transactionError } = await supabase
      .from("financial_transactions")
      .insert({
        property_id: invoice?.property_id,
        transaction_type: 'refund',
        amount: amountToRefund,
        currency: payment.currency,
        source_type: 'payment',
        source_id: params.invoiceId,
        from_user_id: invoice?.issued_by,
        to_user_id: invoice?.issued_to,
        description: `Refund for payment ${params.invoiceId}: ${reason || 'No reason provided'}`,
        transaction_date: new Date().toISOString(),
        status: 'completed'
      });

    if (transactionError) {
      console.error("[POST /api/payments/:invoiceId/refund] Transaction creation error:", transactionError);
      // Don't fail the request if transaction record creation fails
    }

    // TODO: Process actual refund via payment gateway (Stripe, PayPal, etc.)
    // This will be implemented in Phase 4 with payment gateway integration

    // TODO: Send refund confirmation email
    // This will be implemented in Phase 2 with email automation

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      refund_amount: amountToRefund,
      message: "Payment refunded successfully"
    });
  } catch (error: any) {
    console.error("[POST /api/payments/:invoiceId/refund] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

