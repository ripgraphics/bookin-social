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

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, category, price, inventory_quantity, description, images, status, created_at")
      .eq("user_id", publicUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/ecommerce/products] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(products || []);
  } catch (error: any) {
    console.error("[GET /api/ecommerce/products] Error:", error);
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
    const { name, category, price, stock, description = "", images = [] } = body;

    const { data: product, error} = await supabase
      .from("products")
      .insert({
        user_id: publicUser.id,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        category,
        price,
        inventory_quantity: stock,
        track_inventory: true,
        status: 'active',
        images
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/ecommerce/products] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/ecommerce/products] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

