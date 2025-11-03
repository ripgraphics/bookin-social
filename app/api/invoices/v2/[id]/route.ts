import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/invoices/v2/:id
// Get invoice details by ID
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

    const { data: invoice, error } = await supabase
      .from("invoices_v2")
      .select(`
        *,
        property_management (
          id,
          listings (
            id,
            title,
            description,
            image_src
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
          position,
          metadata
        ),
        payments (
          id,
          amount,
          payment_method,
          payment_date,
          status
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("[GET /api/invoices/v2/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("[GET /api/invoices/v2/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/invoices/v2/:id
// Update invoice
export async function PUT(
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
    const {
      customer_name,
      customer_email,
      customer_address,
      tax_rate,
      discount_amount,
      due_date,
      status,
      notes,
      terms,
      line_items
    } = body;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("invoices_v2")
      .select("issued_by, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existing.issued_by !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this invoice" }, { status: 403 });
    }

    // Can only edit draft invoices
    if (existing.status !== 'draft' && status !== 'cancelled') {
      return NextResponse.json({ 
        error: "Can only edit draft invoices or cancel sent invoices" 
      }, { status: 400 });
    }

    // Update invoice
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: publicUser.id
    };

    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (customer_email !== undefined) updateData.customer_email = customer_email;
    if (customer_address !== undefined) updateData.customer_address = customer_address;
    if (tax_rate !== undefined) updateData.tax_rate = tax_rate;
    if (discount_amount !== undefined) updateData.discount_amount = discount_amount;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;

    // If line items are provided, update them
    if (line_items && Array.isArray(line_items)) {
      // Delete existing line items
      await supabase
        .from("invoice_line_items")
        .delete()
        .eq("invoice_id", params.id);

      // Insert new line items
      const lineItemsToInsert = line_items.map((item: any, index: number) => ({
        invoice_id: params.id,
        item_type: item.item_type || 'custom',
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        tax_amount: (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100,
        discount_amount: item.discount_amount || 0,
        total_amount: item.quantity * item.unit_price,
        position: index,
        metadata: item.metadata || {}
      }));

      await supabase
        .from("invoice_line_items")
        .insert(lineItemsToInsert);

      // Recalculate totals
      const subtotal = line_items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      const tax_amount = (subtotal * (tax_rate || updateData.tax_rate || 0)) / 100;
      const total_amount = subtotal + tax_amount - (discount_amount || updateData.discount_amount || 0);

      updateData.subtotal = subtotal;
      updateData.tax_amount = tax_amount;
      updateData.total_amount = total_amount;
      updateData.amount_due = total_amount - (existing.amount_paid || 0);
    }

    const { data: invoice, error } = await supabase
      .from("invoices_v2")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        invoice_line_items (
          id,
          item_type,
          description,
          quantity,
          unit_price,
          total_amount
        )
      `)
      .single();

    if (error) {
      console.error("[PUT /api/invoices/v2/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("[PUT /api/invoices/v2/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invoices/v2/:id
// Delete invoice (draft only)
export async function DELETE(
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

    // Verify ownership and status
    const { data: existing, error: fetchError } = await supabase
      .from("invoices_v2")
      .select("issued_by, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existing.issued_by !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this invoice" }, { status: 403 });
    }

    // Can only delete draft invoices
    if (existing.status !== 'draft') {
      return NextResponse.json({ 
        error: "Can only delete draft invoices. Use cancel for sent invoices." 
      }, { status: 400 });
    }

    // Delete invoice (line items will be deleted via CASCADE)
    const { error } = await supabase
      .from("invoices_v2")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("[DELETE /api/invoices/v2/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/invoices/v2/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

