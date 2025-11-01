import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/profile/photos
 * 
 * Creates photo records in Supabase after Cloudinary upload.
 * This endpoint is kept because it requires server-side user ID resolution.
 * Once photos are created, real-time subscriptions will automatically update the UI.
 * 
 * Note: GET, DELETE, and PATCH operations are handled directly via Supabase client
 * in PhotosGalleryCard component, leveraging RLS policies for security.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { image_urls, captions, album_name } = body;

    // Support both single and multiple uploads
    const urls = Array.isArray(image_urls) ? image_urls : image_urls ? [image_urls] : [];
    const captionArray = Array.isArray(captions) ? captions : captions ? [captions] : [];

    if (urls.length === 0) {
      return NextResponse.json({ error: 'Missing image_urls' }, { status: 400 });
    }

    // Create photo records
    const photosToInsert = urls.map((url: string, index: number) => ({
      user_id: publicUser.id,
      image_url: url,
      caption: captionArray[index] || '',
      album_name: album_name || 'default',
      is_public: true,
    }));

    const { data: photos, error } = await supabase
      .from('user_photos')
      .insert(photosToInsert)
      .select();

    if (error) {
      console.error('[POST /api/profile/photos] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return array for multiple, single object for single upload
    return NextResponse.json(urls.length === 1 ? photos[0] : photos);
  } catch (error: any) {
    console.error('[POST /api/profile/photos] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

