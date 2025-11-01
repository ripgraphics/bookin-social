import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: email, error } = await supabase
      .from("emails")
      .select(`
        *,
        sender:users!emails_sender_id_fkey(id, email, first_name, last_name),
        email_recipients(*),
        email_attachments(*)
      `)
      .eq("id", emailId)
      .single();

    if (error) {
      console.error("[GET /api/emails/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(email);
  } catch (error: any) {
    console.error("[GET /api/emails/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { is_read, is_starred, folder } = body;

    const updateData: any = {};
    if (is_read !== undefined) updateData.is_read = is_read;
    if (is_starred !== undefined) updateData.is_starred = is_starred;
    if (folder) updateData.folder = folder;

    const { data: email, error } = await supabase
      .from("emails")
      .update(updateData)
      .eq("id", emailId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/emails/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(email);
  } catch (error: any) {
    console.error("[PATCH /api/emails/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", emailId);

    if (error) {
      console.error("[DELETE /api/emails/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/emails/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

