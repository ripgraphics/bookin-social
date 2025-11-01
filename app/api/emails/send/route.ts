import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { email_id } = body;

    // Update email folder to "sent"
    const { data: email, error } = await supabase
      .from("emails")
      .update({ 
        folder: "sent",
        updated_at: new Date().toISOString()
      })
      .eq("id", email_id)
      .eq("sender_id", publicUser.id)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/emails/send] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // In a real application, you would integrate with an email service here
    // For now, we just mark it as sent

    return NextResponse.json(email);
  } catch (error: any) {
    console.error("[POST /api/emails/send] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

