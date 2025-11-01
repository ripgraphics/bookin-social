import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    if (!postId || typeof postId !== 'string') {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    console.log('[PATCH /api/profile/posts/[postId]] Request received for post:', postId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[PATCH /api/profile/posts/[postId]] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !publicUser) {
      console.error('[PATCH /api/profile/posts/[postId]] User lookup error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the post exists and belongs to the user
    const { data: existingPost, error: fetchError } = await supabase
      .from('user_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      console.error('[PATCH /api/profile/posts/[postId]] Post not found:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.user_id !== publicUser.id) {
      console.error('[PATCH /api/profile/posts/[postId]] Unauthorized: Post does not belong to user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[PATCH /api/profile/posts/[postId]] Request body:', body);
    } catch (parseError: any) {
      console.error('[PATCH /api/profile/posts/[postId]] JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { post_type, content, image_urls } = body;

    // Build update data (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (post_type !== undefined) updateData.post_type = post_type;
    if (content !== undefined) updateData.content = content;
    if (image_urls !== undefined) updateData.image_urls = image_urls;

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('user_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/profile/posts/[postId]] Update error:', updateError);
      console.error('[PATCH /api/profile/posts/[postId]] Update error details:', JSON.stringify(updateError, null, 2));
      return NextResponse.json({ error: updateError.message, details: updateError }, { status: 500 });
    }

    console.log('[PATCH /api/profile/posts/[postId]] Post updated successfully:', updatedPost?.id);
    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error('[PATCH /api/profile/posts/[postId]] Unexpected error:', error);
    console.error('[PATCH /api/profile/posts/[postId]] Error stack:', error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
    if (!postId || typeof postId !== 'string') {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    console.log('[DELETE /api/profile/posts/[postId]] Request received for post:', postId);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[DELETE /api/profile/posts/[postId]] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !publicUser) {
      console.error('[DELETE /api/profile/posts/[postId]] User lookup error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the post exists and belongs to the user
    const { data: existingPost, error: fetchError } = await supabase
      .from('user_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      console.error('[DELETE /api/profile/posts/[postId]] Post not found:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.user_id !== publicUser.id) {
      console.error('[DELETE /api/profile/posts/[postId]] Unauthorized: Post does not belong to user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from('user_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('[DELETE /api/profile/posts/[postId]] Delete error:', deleteError);
      console.error('[DELETE /api/profile/posts/[postId]] Delete error details:', JSON.stringify(deleteError, null, 2));
      return NextResponse.json({ error: deleteError.message, details: deleteError }, { status: 500 });
    }

    console.log('[DELETE /api/profile/posts/[postId]] Post deleted successfully:', postId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/profile/posts/[postId]] Unexpected error:', error);
    console.error('[DELETE /api/profile/posts/[postId]] Error stack:', error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

