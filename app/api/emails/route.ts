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
      .select("id, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "inbox";

    let query = supabase
      .from("emails")
      .select(`
        *,
        sender:users!emails_sender_id_fkey(id, email, first_name, last_name),
        email_recipients!inner(email, recipient_type)
      `);

    if (folder === "inbox") {
      // For inbox, get emails where user is a recipient
      query = query.eq("email_recipients.email", publicUser.email);
    } else {
      // For sent, drafts, trash - get emails where user is the sender
      query = query.eq("sender_id", publicUser.id);
    }

    if (folder) {
      query = query.eq("folder", folder);
    }

    const { data: emails, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/emails] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(emails || []);
  } catch (error: any) {
    console.error("[GET /api/emails] Error:", error);
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
      .select("id, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { subject, content, recipients, folder = "drafts", attachments = [] } = body;

    // Create email
    const { data: email, error: emailError } = await supabase
      .from("emails")
      .insert({
        subject,
        content,
        from_email: publicUser.email,
        sender_id: publicUser.id,
        user_id: publicUser.id,  // Added per schema fix
        folder
      })
      .select()
      .single();

    if (emailError) {
      console.error("[POST /api/emails] Error:", emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    // Add recipients
    if (recipients && recipients.length > 0) {
      const recipientData = recipients.map((r: any) => ({
        email_id: email.id,
        email: r.email,
        recipient_type: r.type || "to"
      }));

      await supabase.from("email_recipients").insert(recipientData);
    }

    // Add attachments
    if (attachments.length > 0) {
      const attachmentData = attachments.map((att: any) => ({
        email_id: email.id,
        file_url: att.file_url,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size
      }));

      await supabase.from("email_attachments").insert(attachmentData);
    }

    return NextResponse.json(email, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/emails] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

