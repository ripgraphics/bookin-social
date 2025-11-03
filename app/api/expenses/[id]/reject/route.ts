import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/expenses/:id/reject
// Reject an expense (property owner only)
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
    const { rejection_reason } = body;

    if (!rejection_reason) {
      return NextResponse.json({ 
        error: "rejection_reason is required" 
      }, { status: 400 });
    }

    // Get expense with property details
    const { data: expense, error: fetchError } = await supabase
      .from("property_expenses")
      .select(`
        *,
        property_management (
          id,
          owner_id
        )
      `)
      .eq("id", params.id)
      .single();

    if (fetchError || !expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Verify user is the property owner
    if (expense.property_management?.owner_id !== publicUser.id) {
      return NextResponse.json({ 
        error: "Only the property owner can reject expenses" 
      }, { status: 403 });
    }

    // Can only reject pending expenses
    if (expense.status !== 'pending') {
      return NextResponse.json({ 
        error: "Can only reject pending expenses" 
      }, { status: 400 });
    }

    // Reject expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from("property_expenses")
      .update({
        status: 'rejected',
        rejection_reason,
        approved_by: publicUser.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select(`
        *,
        property_management (
          id,
          listings (
            id,
            title
          )
        ),
        created_by_user:users!created_by (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error("[POST /api/expenses/:id/reject] Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // TODO: Send notification to expense creator with rejection reason
    // This will be implemented in Phase 2 with email automation

    return NextResponse.json({
      success: true,
      expense: updatedExpense,
      message: "Expense rejected successfully"
    });
  } catch (error: any) {
    console.error("[POST /api/expenses/:id/reject] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

