import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pms/owner/statements
// Get financial statements for property owners
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

    // Get user's property IDs
    const { data: properties } = await supabase
      .from("property_management")
      .select("listing_id")
      .eq("owner_id", publicUser.id);

    if (!properties || properties.length === 0) {
      return NextResponse.json([]);
    }

    const propertyIds = properties.map(p => p.listing_id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";

    // Get revenue data
    const { data: revenueData } = await supabase
      .from("invoices_v2")
      .select("property_id, total_amount")
      .in("property_id", propertyIds)
      .eq("payment_status", "paid");

    // Get expenses data
    const { data: expensesData } = await supabase
      .from("property_expenses")
      .select("property_id, amount")
      .in("property_id", propertyIds);

    // Group by property and calculate totals
    const revenueByProperty = new Map<string, number>();
    const expensesByProperty = new Map<string, number>();

    revenueData?.forEach((item: any) => {
      const current = revenueByProperty.get(item.property_id) || 0;
      revenueByProperty.set(item.property_id, current + parseFloat(item.total_amount));
    });

    expensesData?.forEach((item: any) => {
      const current = expensesByProperty.get(item.property_id) || 0;
      expensesByProperty.set(item.property_id, current + parseFloat(item.amount));
    });

    // Get property details
    const { data: propertyDetails } = await supabase
      .from("listings")
      .select("id, title")
      .in("id", propertyIds);

    // Build statements based on period
    const statements: any[] = [];

    if (period === "all" || period === "monthly" || period === "quarterly" || period === "yearly") {
      // For now, return one statement with all data
      // In the future, this can be broken down by period
      const totalRevenue = revenueData?.reduce((sum, item: any) => sum + parseFloat(item.total_amount), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, item: any) => sum + parseFloat(item.amount), 0) || 0;
      const netIncome = totalRevenue - totalExpenses;

      const revenueByPropertyArray = Array.from(revenueByProperty.entries()).map(([propertyId, revenue]) => {
        const expenses = expensesByProperty.get(propertyId) || 0;
        const property = propertyDetails?.find(p => p.id === propertyId);
        return {
          propertyId,
          propertyTitle: property?.title || "Property",
          revenue,
          expenses,
          net: revenue - expenses
        };
      });

      statements.push({
        period: "All Time",
        totalRevenue,
        totalExpenses,
        netIncome,
        propertyCount: propertyIds.length,
        revenueByProperty: revenueByPropertyArray
      });
    }

    return NextResponse.json(statements);
  } catch (error: any) {
    console.error("[GET /api/pms/owner/statements] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

