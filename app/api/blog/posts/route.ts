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

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("user_id", publicUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/blog/posts] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(posts || []);
  } catch (error: any) {
    console.error("[GET /api/blog/posts] Error:", error);
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

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: publicUser.id,
        ...body
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/blog/posts] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/blog/posts] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

