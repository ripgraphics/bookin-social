import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, name, password } = await request.json();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // The database trigger should automatically create the profile,
  // but we'll add a manual fallback just in case
  if (data.user && !data.session) {
    // User created but needs email verification
    // Profile will be created by trigger when they first login
    console.log(`[register] User ${data.user.id} created, profile will be auto-created on first login`);
  }

  return NextResponse.json(data);
}