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

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", publicUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/ecommerce/orders] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders || []);
  } catch (error: any) {
    console.error("[GET /api/ecommerce/orders] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

