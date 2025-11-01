import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", publicUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/invoices] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(invoices || []);
  } catch (error: any) {
    console.error("[GET /api/invoices] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { customer_name, customer_email, due_date, line_items, total_amount, tax_amount } = body;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Calculate subtotal from line items
    const subtotal = line_items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;
    const tax = tax_amount || 0;
    const total = subtotal + tax;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        user_id: publicUser.id,
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: due_date || new Date().toISOString().split('T')[0],
        subtotal: subtotal.toString(),
        tax_amount: tax.toString(),
        total: total.toString(),
        status: "pending",
        notes: JSON.stringify({ customer_name, customer_email, line_items })
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/invoices] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse line_items from notes if present
    let parsedLineItems = [];
    if (invoice.notes) {
      try {
        const notesData = JSON.parse(invoice.notes);
        parsedLineItems = notesData.line_items || [];
      } catch (e) {
        // Notes not JSON, ignore
      }
    }

    const responseInvoice = {
      ...invoice,
      line_items: parsedLineItems
    };

    return NextResponse.json(responseInvoice, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/invoices] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

