import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user posts
    const { data: posts, error } = await supabase
      .from('user_posts')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/profile/posts] Error:', error);
      console.error('[GET /api/profile/posts] Error details:', JSON.stringify(error, null, 2));
      console.error('[GET /api/profile/posts] User ID:', publicUser.id);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json(posts || []);
  } catch (error: any) {
    console.error('[GET /api/profile/posts] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/profile/posts] Request received');
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[POST /api/profile/posts] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!user) {
      console.error('[POST /api/profile/posts] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[POST /api/profile/posts] User authenticated:', user.id);

    // Get the user's public.users id
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError) {
      console.error('[POST /api/profile/posts] User lookup error:', userError);
      return NextResponse.json({ error: 'User lookup failed', details: userError.message }, { status: 500 });
    }

    if (!publicUser) {
      console.error('[POST /api/profile/posts] Public user not found for auth user:', user.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[POST /api/profile/posts] Public user found:', publicUser.id);

    let body;
    try {
      body = await request.json();
      console.log('[POST /api/profile/posts] Request body:', body);
    } catch (parseError: any) {
      console.error('[POST /api/profile/posts] JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { post_type, content, image_urls } = body;

    if (!post_type || !content) {
      console.error('[POST /api/profile/posts] Missing required fields:', { post_type, content });
      return NextResponse.json({ error: 'Missing post_type or content' }, { status: 400 });
    }

    // Create post
    const { data: post, error: insertError } = await supabase
      .from('user_posts')
      .insert({
        user_id: publicUser.id,
        post_type: post_type || 'post',
        content,
        image_urls: image_urls || [],
        is_public: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[POST /api/profile/posts] Insert error:', insertError);
      console.error('[POST /api/profile/posts] Insert error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json({ error: insertError.message, details: insertError }, { status: 500 });
    }

    console.log('[POST /api/profile/posts] Post created successfully:', post?.id);
    return NextResponse.json(post);
  } catch (error: any) {
    console.error('[POST /api/profile/posts] Unexpected error:', error);
    console.error('[POST /api/profile/posts] Error stack:', error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

