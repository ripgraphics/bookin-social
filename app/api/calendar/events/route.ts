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

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let query = supabase
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
      .eq("user_id", publicUser.id);

    if (start) {
      query = query.gte("start_time", start);
    }
    if (end) {
      query = query.lte("end_time", end);
    }

    const { data: events, error } = await query.order("start_time", { ascending: true });

    if (error) {
      console.error("[GET /api/calendar/events] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(events || []);
  } catch (error: any) {
    console.error("[GET /api/calendar/events] Error:", error);
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
    const { 
      title, 
      description, 
      start_time, 
      end_time, 
      is_all_day = false,
      location,
      color,
      attendees = []
    } = body;

    // Create event
    const { data: event, error: eventError } = await supabase
      .from("calendar_events")
      .insert({
        title,
        description,
        start_time,
        end_time,
        is_all_day,
        location,
        color,
        user_id: publicUser.id
      })
      .select()
      .single();

    if (eventError) {
      console.error("[POST /api/calendar/events] Error:", eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    // Add attendees
    if (attendees.length > 0) {
      const attendeeData = attendees.map((userId: string) => ({
        event_id: event.id,
        user_id: userId,
        status: "pending"
      }));

      await supabase.from("event_attendees").insert(attendeeData);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/calendar/events] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

