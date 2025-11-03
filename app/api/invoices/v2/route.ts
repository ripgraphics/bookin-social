import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/invoices/v2
// List invoices for the current user (filtered by role)
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
    const invoice_type = searchParams.get("invoice_type");
    const status = searchParams.get("status");
    const property_id = searchParams.get("property_id");

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select(`
        roles (
          name
        )
      `)
      .eq("user_id", publicUser.id);

    const isAdmin = userRoles?.some((ur: any) => 
      ur.roles?.name === 'admin' || ur.roles?.name === 'super_admin'
    );

    // Get user's property IDs if owner
    const { data: ownedProperties } = await supabase
      .from("property_management")
      .select("listing_id")
      .eq("owner_id", publicUser.id);

    const ownedPropertyIds = ownedProperties?.map(p => p.listing_id) || [];

    // Build query
    let query = supabase
      .from("invoices_v2")
      .select(`
        *,
        property_management (
          id,
          listings (
            id,
            title
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
          total_amount
        )
      `);

    // Apply filters based on role
    if (isAdmin) {
      // Admins see all invoices
      query = query;
    } else if (ownedPropertyIds.length > 0) {
      // Owners see invoices for their properties OR invoices issued to/by them
      query = query.or(`issued_by.eq.${publicUser.id},issued_to.eq.${publicUser.id},property_id.in.(${ownedPropertyIds.join(',')})`);
    } else {
      // Hosts/Co-Hosts/Guests see invoices issued to them or by them
      query = query.or(`issued_by.eq.${publicUser.id},issued_to.eq.${publicUser.id}`);
    }

    query = query.order("created_at", { ascending: false });

    // Apply filters
    if (invoice_type) {
      query = query.eq("invoice_type", invoice_type);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (property_id) {
      query = query.eq("property_id", property_id);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error("[GET /api/invoices/v2] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(invoices || []);
  } catch (error: any) {
    console.error("[GET /api/invoices/v2] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices/v2
// Create a new invoice
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
      invoice_type,
      property_id,
      reservation_id,
      issued_to,
      customer_type,
      customer_name,
      customer_email,
      customer_address,
      currency,
      tax_rate,
      discount_amount,
      due_date,
      notes,
      terms,
      line_items
    } = body;

    // Validate required fields
    if (!invoice_type || !['rental', 'operational', 'custom'].includes(invoice_type)) {
      return NextResponse.json({ 
        error: "invoice_type is required and must be 'rental', 'operational', or 'custom'" 
      }, { status: 400 });
    }

    if (!issued_to) {
      return NextResponse.json({ error: "issued_to is required" }, { status: 400 });
    }

    if (!customer_name || !customer_email) {
      return NextResponse.json({ error: "customer_name and customer_email are required" }, { status: 400 });
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: "line_items array is required and must not be empty" }, { status: 400 });
    }

    // Generate invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase
      .rpc('generate_invoice_number', { invoice_type });

    if (invoiceNumberError) {
      console.error("[POST /api/invoices/v2] Invoice number generation error:", invoiceNumberError);
      // Fallback to simple generation
      const timestamp = Date.now();
      const prefix = invoice_type === 'rental' ? 'RNT' : invoice_type === 'operational' ? 'OPS' : 'CST';
      var invoice_number = `${prefix}-${new Date().getFullYear()}-${timestamp}`;
    } else {
      var invoice_number = invoiceNumberData;
    }

    // Calculate subtotal from line items
    const subtotal = line_items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const tax_amount = (subtotal * (tax_rate || 0)) / 100;
    const total_amount = subtotal + tax_amount - (discount_amount || 0);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices_v2")
      .insert({
        invoice_number,
        invoice_type,
        property_id,
        reservation_id,
        issued_by: publicUser.id,
        issued_to,
        customer_type: customer_type || 'guest',
        customer_name,
        customer_email,
        customer_address: customer_address || {},
        currency: currency || 'USD',
        subtotal,
        tax_rate: tax_rate || 0,
        tax_amount,
        discount_amount: discount_amount || 0,
        total_amount,
        amount_paid: 0,
        amount_due: total_amount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        payment_status: 'unpaid',
        notes,
        terms,
        created_by: publicUser.id
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("[POST /api/invoices/v2] Invoice creation error:", invoiceError);
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    // Create line items
    const lineItemsToInsert = line_items.map((item: any, index: number) => ({
      invoice_id: invoice.id,
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

    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(lineItemsToInsert);

    if (lineItemsError) {
      console.error("[POST /api/invoices/v2] Line items creation error:", lineItemsError);
      // Rollback invoice creation
      await supabase.from("invoices_v2").delete().eq("id", invoice.id);
      return NextResponse.json({ error: lineItemsError.message }, { status: 500 });
    }

    // Fetch complete invoice with line items
    const { data: completeInvoice } = await supabase
      .from("invoices_v2")
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
      .eq("id", invoice.id)
      .single();

    return NextResponse.json(completeInvoice);
  } catch (error: any) {
    console.error("[POST /api/invoices/v2] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

