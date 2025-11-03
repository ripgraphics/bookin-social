import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/expenses
// List expenses for the current user
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const property_id = searchParams.get("property_id");
    const expense_type = searchParams.get("expense_type");
    const status = searchParams.get("status");

    // Build query - user can see expenses they created or for properties they own
    let query = supabase
      .from("property_expenses")
      .select(`
        *,
        property_management (
          id,
          owner_id,
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
          status
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (property_id) {
      query = query.eq("property_id", property_id);
    }
    if (expense_type) {
      query = query.eq("expense_type", expense_type);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error("[GET /api/expenses] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter expenses based on user permissions
    const filteredExpenses = (expenses || []).filter((expense: any) => {
      return expense.created_by === publicUser.id || 
             expense.property_management?.owner_id === publicUser.id;
    });

    return NextResponse.json(filteredExpenses);
  } catch (error: any) {
    console.error("[GET /api/expenses] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/expenses
// Create a new expense
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
      property_id,
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

    // Validate required fields
    if (!property_id) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    if (!expense_type || !['repair', 'cleaning', 'maintenance', 'utilities', 'supplies', 'insurance', 'taxes', 'other'].includes(expense_type)) {
      return NextResponse.json({ 
        error: "expense_type is required and must be valid" 
      }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "amount is required and must be positive" }, { status: 400 });
    }

    // Verify property exists and user has permission
    const { data: property, error: propertyError } = await supabase
      .from("property_management")
      .select("id, owner_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Check if user is assigned to this property
    const { data: assignment } = await supabase
      .from("property_assignments")
      .select("id")
      .eq("property_id", property_id)
      .eq("user_id", publicUser.id)
      .eq("status", "active")
      .single();

    if (!assignment && property.owner_id !== publicUser.id) {
      return NextResponse.json({ 
        error: "You do not have permission to create expenses for this property" 
      }, { status: 403 });
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from("property_expenses")
      .insert({
        property_id,
        expense_type,
        category,
        vendor_name,
        vendor_id,
        description,
        amount,
        currency: currency || 'USD',
        expense_date: expense_date || new Date().toISOString().split('T')[0],
        payment_method,
        receipt_url,
        attachments: attachments || [],
        status: 'pending',
        notes,
        metadata: metadata || {},
        created_by: publicUser.id
      })
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
      console.error("[POST /api/expenses] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("[POST /api/expenses] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

