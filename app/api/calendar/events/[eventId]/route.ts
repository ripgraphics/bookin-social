import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: event, error } = await supabase
      .from("calendar_events")
      .select(`
        *,
        creator:users!calendar_events_user_id_fkey(id, email, first_name, last_name),
        event_attendees(
          user_id,
          status,
          user:users(id, email, first_name, last_name)
        )
      `)
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("[GET /api/calendar/events/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("[GET /api/calendar/events/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, start_time, end_time, is_all_day, location, color } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (is_all_day !== undefined) updateData.is_all_day = is_all_day;
    if (location !== undefined) updateData.location = location;
    if (color !== undefined) updateData.color = color;

    const { data: event, error } = await supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/calendar/events/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("[PATCH /api/calendar/events/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("[DELETE /api/calendar/events/[id]] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/calendar/events/[id]] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

