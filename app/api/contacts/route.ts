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

    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", publicUser.id)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("[GET /api/contacts] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contacts || []);
  } catch (error: any) {
    console.error("[GET /api/contacts] Error:", error);
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

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        user_id: publicUser.id,
        ...body
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/contacts] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/contacts] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

