import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/expenses/:id
// Get expense details by ID
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

    const { data: expense, error } = await supabase
      .from("property_expenses")
      .select(`
        *,
        property_management (
          id,
          owner_id,
          listings (
            id,
            title,
            description
          )
        ),
        created_by_user:users!created_by (
          id,
          first_name,
          last_name,
          email
        ),
        approved_by_user:users!approved_by (
          id,
          first_name,
          last_name,
          email
        ),
        invoices_v2 (
          id,
          invoice_number,
          status,
          total_amount
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("[GET /api/expenses/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("[GET /api/expenses/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/expenses/:id
// Update expense
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
      expense_type,
      category,
      vendor_name,
      vendor_id,
      description,
      amount,
      currency,
      expense_date,
      payment_method,
      receipt_url,
      attachments,
      notes,
      metadata
    } = body;

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("property_expenses")
      .select("created_by, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (existing.created_by !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this expense" }, { status: 403 });
    }

    // Can only edit pending expenses
    if (existing.status !== 'pending') {
      return NextResponse.json({ 
        error: "Can only edit pending expenses" 
      }, { status: 400 });
    }

    // Update expense
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (expense_type !== undefined) updateData.expense_type = expense_type;
    if (category !== undefined) updateData.category = category;
    if (vendor_name !== undefined) updateData.vendor_name = vendor_name;
    if (vendor_id !== undefined) updateData.vendor_id = vendor_id;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = amount;
    if (currency !== undefined) updateData.currency = currency;
    if (expense_date !== undefined) updateData.expense_date = expense_date;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (notes !== undefined) updateData.notes = notes;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data: expense, error } = await supabase
      .from("property_expenses")
      .update(updateData)
      .eq("id", params.id)
      .select(`
        *,
        property_management (
          id,
          listings (
            id,
            title
          )
        )
      `)
      .single();

    if (error) {
      console.error("[PUT /api/expenses/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("[PUT /api/expenses/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/expenses/:id
// Delete expense (pending only)
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
      .from("property_expenses")
      .select("created_by, status")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (existing.created_by !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this expense" }, { status: 403 });
    }

    // Can only delete pending expenses
    if (existing.status !== 'pending') {
      return NextResponse.json({ 
        error: "Can only delete pending expenses" 
      }, { status: 400 });
    }

    // Delete expense
    const { error } = await supabase
      .from("property_expenses")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("[DELETE /api/expenses/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/expenses/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

