import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivityFromRequest } from '@/lib/activityLogger';
import { extractPublicIdFromUrl, deleteCloudinaryImage } from '@/lib/cloudinary';

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
    const { imageUrl, imageType } = body; // 'avatar' or 'cover'

    if (!imageUrl || !imageType) {
      return NextResponse.json({ error: 'Missing imageUrl or imageType' }, { status: 400 });
    }

    if (!['avatar', 'cover'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid imageType. Must be "avatar" or "cover"' }, { status: 400 });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', publicUser.id)
      .single();

    const updateField = imageType === 'avatar' ? 'avatar_url' : 'cover_image_url';

    let profileData;
    if (existingProfile) {
      // Update existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          [updateField]: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', publicUser.id)
        .select()
        .single();

      if (profileError) {
        console.error('[POST /api/profile/images] Error:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      profileData = profile;
    } else {
      // Create new profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: publicUser.id,
          [updateField]: imageUrl,
        })
        .select()
        .single();

      if (profileError) {
        console.error('[POST /api/profile/images] Error:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      profileData = profile;
    }

    // Log activity
    await logActivityFromRequest(
      publicUser.id,
      imageType === 'avatar' ? 'avatar_upload' : 'cover_image_upload',
      `${imageType === 'avatar' ? 'Avatar' : 'Cover image'} uploaded`,
      request,
      { image_url: imageUrl }
    );

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('[POST /api/profile/images] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type');

    if (!imageType || !['avatar', 'cover'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid imageType. Must be "avatar" or "cover"' }, { status: 400 });
    }

    const updateField = imageType === 'avatar' ? 'avatar_url' : 'cover_image_url';

    // First, get the current image URL before deleting
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select(updateField)
      .eq('user_id', publicUser.id)
      .maybeSingle();

    const imageUrlToDelete = currentProfile?.[updateField as 'avatar_url' | 'cover_image_url'];

    // Delete image from Cloudinary if it exists
    if (imageUrlToDelete) {
      const publicId = extractPublicIdFromUrl(imageUrlToDelete);
      if (publicId) {
        try {
          console.log(`[DELETE /api/profile/images] Attempting to delete Cloudinary image: ${publicId}`);
          const deleted = await deleteCloudinaryImage(publicId);
          if (deleted) {
            console.log(`[DELETE /api/profile/images] Successfully deleted Cloudinary image: ${publicId}`);
          } else {
            console.warn(`[DELETE /api/profile/images] Failed to delete Cloudinary image: ${publicId}`);
            // Continue with database update even if Cloudinary deletion fails
          }
        } catch (error) {
          console.error('[DELETE /api/profile/images] Error deleting from Cloudinary:', error);
          // Continue with database update even if Cloudinary deletion fails
        }
      } else {
        console.warn(`[DELETE /api/profile/images] Could not extract public_id from URL: ${imageUrlToDelete}`);
      }
    }

    // Update profile to remove image reference
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        [updateField]: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', publicUser.id)
      .select()
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no profile case

    if (profileError) {
      console.error('[DELETE /api/profile/images] Profile update error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // If no profile exists, that's fine - nothing to delete
    if (!profile) {
      return NextResponse.json({ message: 'No profile found, nothing to delete' }, { status: 200 });
    }

    // Log activity (don't let this fail the request)
    try {
      await logActivityFromRequest(
        publicUser.id,
        imageType === 'avatar' ? 'avatar_upload' : 'cover_image_upload',
        `${imageType === 'avatar' ? 'Avatar' : 'Cover image'} removed`,
        request
      );
    } catch (logError) {
      console.error('[DELETE /api/profile/images] Activity log error:', logError);
      // Continue anyway - logging failure shouldn't fail the request
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('[DELETE /api/profile/images] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

