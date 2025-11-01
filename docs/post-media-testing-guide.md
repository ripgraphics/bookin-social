# Post Media Testing Guide

## Implementation Summary

### ✅ Completed Features

1. **VideoLinkInput Component** (`app/components/inputs/VideoLinkInput.tsx`)
   - ✅ Supports YouTube, Vimeo, Dailymotion, and TikTok
   - ✅ Platform detection and video ID extraction
   - ✅ Embed URL generation for all platforms
   - ✅ Validation and error messages
   - ✅ Video preview before submission

2. **CreatePostCard Component** (`app/(admin)/admin/apps/profile/components/CreatePostCard.tsx`)
   - ✅ Multiple image upload support (max 10MB each, up to 10 images)
   - ✅ Video link input integration
   - ✅ Toggle between "Upload Photos" and "Share Video Link"
   - ✅ Form state management and reset

3. **PostCard Component** (`app/(admin)/admin/apps/profile/components/PostCard.tsx`)
   - ✅ Video embed display for all platforms
   - ✅ Multiple image grid layout (up to 4 previews)
   - ✅ Single image display

4. **EditPostModal Component** (`app/(admin)/admin/apps/profile/components/EditPostModal.tsx`)
   - ✅ Image upload and video link editing support

## Manual Testing Checklist

### Prerequisites
- User must be logged in (profile page requires authentication)
- Navigate to: `http://localhost:3003/apps/profile`

### Test 1: Multiple Image Uploads

**Steps:**
1. Click "Photos / Video" button
2. Click "Upload Photos" button (should be selected by default)
3. Upload 2-3 images using the drag-and-drop area or file picker
4. Add text content: "Testing multiple image uploads"
5. Click "Post" button
6. Verify post appears in feed with all images displayed

**Expected Results:**
- ✅ Images upload successfully to Cloudinary (`user_profile/post` folder)
- ✅ All images appear in post feed
- ✅ Images display in grid layout (2 images = side by side, 3+ images = grid)
- ✅ Images are converted to WebP format
- ✅ Post type is set to 'photo'

### Test 2: YouTube Video Link

**Steps:**
1. Click "Photos / Video" button
2. Click "Share Video Link" button
3. Paste YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Verify preview appears
5. Add text content: "Testing YouTube video"
6. Click "Post" button
7. Verify video embeds correctly in feed

**Expected Results:**
- ✅ URL converts to embed format: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- ✅ Preview shows before submission
- ✅ Video embeds correctly in post feed
- ✅ Post type is set to 'video'

### Test 3: Vimeo Video Link

**Steps:**
1. Click "Photos / Video" button
2. Click "Share Video Link" button
3. Paste Vimeo URL: `https://vimeo.com/123456789` (use a real Vimeo video ID)
4. Verify preview appears
5. Add text content: "Testing Vimeo video"
6. Click "Post" button
7. Verify video embeds correctly in feed

**Expected Results:**
- ✅ URL converts to embed format: `https://player.vimeo.com/video/123456789`
- ✅ Preview shows before submission
- ✅ Video embeds correctly in post feed
- ✅ Post type is set to 'video'

**Test URLs:**
- `https://vimeo.com/148751763` (example Vimeo video)
- `https://player.vimeo.com/video/148751763`
- `https://vimeo.com/channels/staffpicks/148751763`

### Test 4: Dailymotion Video Link

**Steps:**
1. Click "Photos / Video" button
2. Click "Share Video Link" button
3. Paste Dailymotion URL: `https://www.dailymotion.com/video/x8s5q1w` (use a real Dailymotion video ID)
4. Verify preview appears
5. Add text content: "Testing Dailymotion video"
6. Click "Post" button
7. Verify video embeds correctly in feed

**Expected Results:**
- ✅ URL converts to embed format: `https://www.dailymotion.com/embed/video/x8s5q1w`
- ✅ Preview shows before submission
- ✅ Video embeds correctly in post feed
- ✅ Post type is set to 'video'

**Test URLs:**
- `https://www.dailymotion.com/video/x8s5q1w`
- `https://dai.ly/x8s5q1w`

### Test 5: TikTok Video Link

**Steps:**
1. Click "Photos / Video" button
2. Click "Share Video Link" button
3. Paste TikTok URL: `https://www.tiktok.com/@username/video/1234567890123456789` (use a real TikTok video URL)
4. Verify preview appears (or error if TikTok embed requires additional setup)
5. Add text content: "Testing TikTok video"
6. Click "Post" button
7. Verify video embeds correctly in feed (if supported)

**Expected Results:**
- ✅ URL converts to embed format: `https://www.tiktok.com/embed/v2/1234567890123456789`
- ✅ Preview may or may not show (TikTok embed may require additional permissions)
- ✅ Video may embed in feed (depends on TikTok embed restrictions)

**Note:** TikTok embeds may require additional configuration or may not work due to TikTok's embed restrictions. This is expected behavior.

**Test URLs:**
- `https://www.tiktok.com/@username/video/1234567890123456789`

### Test 6: Invalid Video URLs

**Steps:**
1. Click "Photos / Video" button
2. Click "Share Video Link" button
3. Paste invalid URL: `https://example.com/video`
4. Click outside input field (blur)
5. Verify error message appears

**Expected Results:**
- ✅ Error message shows list of supported platforms
- ✅ Error message explains valid URL formats
- ✅ Post button remains disabled

### Test 7: Edit Post with Images

**Steps:**
1. Find a post with images
2. Click three-dot menu (if you own the post)
3. Click "Edit Post"
4. Add/remove images using image upload component
5. Update text content
6. Click "Update Post"
7. Verify changes appear in feed

**Expected Results:**
- ✅ Modal opens with existing images pre-loaded
- ✅ Can add more images
- ✅ Can remove images
- ✅ Changes save correctly
- ✅ Feed updates immediately

### Test 8: Edit Post with Video

**Steps:**
1. Find a post with video
2. Click three-dot menu (if you own the post)
3. Click "Edit Post"
4. Change video URL or switch to images
5. Update text content
6. Click "Update Post"
7. Verify changes appear in feed

**Expected Results:**
- ✅ Modal opens with existing video URL pre-loaded
- ✅ Can change video URL
- ✅ Can switch to image upload
- ✅ Changes save correctly
- ✅ Feed updates immediately

### Test 9: Image Size Validation

**Steps:**
1. Click "Photos / Video" button
2. Click "Upload Photos" button
3. Try uploading an image larger than 10MB
4. Verify error message appears

**Expected Results:**
- ✅ Error message: "File size exceeds 10MB limit"
- ✅ Large file is rejected
- ✅ Can still upload valid images

### Test 10: Multiple Images Display

**Steps:**
1. Create a post with 5 images
2. Verify display in feed

**Expected Results:**
- ✅ First 4 images show in grid (2x2)
- ✅ "+X more" indicator shows for images beyond 4
- ✅ Clicking on images should open viewer (if implemented)

## Known Limitations

1. **TikTok Embeds**: TikTok may require additional configuration or API keys for embeds to work properly. Some TikTok URLs may not embed due to privacy/embed restrictions.

2. **Facebook Videos**: Not currently supported (requires app_id and oAuth setup).

3. **Instagram Videos**: Not currently supported (requires Instagram API access).

## Platform Support Summary

| Platform | Supported | Embed Format | Tested |
|----------|-----------|--------------|--------|
| YouTube  | ✅ Yes    | `youtube.com/embed/VIDEO_ID` | ✅ Yes |
| Vimeo    | ✅ Yes    | `player.vimeo.com/video/VIDEO_ID` | ⏳ Pending |
| Dailymotion | ✅ Yes | `dailymotion.com/embed/video/VIDEO_ID` | ⏳ Pending |
| TikTok   | ✅ Yes    | `tiktok.com/embed/v2/VIDEO_ID` | ⏳ Pending |
| Facebook | ❌ No     | Requires app_id | N/A |
| Instagram | ❌ No    | Requires API access | N/A |

## Code Implementation Details

### VideoLinkInput Component
- **Location**: `app/components/inputs/VideoLinkInput.tsx`
- **Platform Detection**: Regex-based detection for each platform
- **Video ID Extraction**: Platform-specific regex patterns
- **Embed URL Generation**: Converts original URLs to iframe-compatible embed URLs

### Image Upload
- **Component**: `CustomImageUpload` (reusable)
- **Max Size**: 10MB per image
- **Max Files**: 10 images
- **Format**: WebP (via Cloudinary preset)
- **Folder**: `user_profile/post`

### Post Display
- **PostCard**: Uses generic iframe for all video platforms
- **Image Grid**: Responsive grid layout (1-4 images visible, "+X more" for additional)

## Next Steps for Full Testing

1. **Manual Browser Testing**: Follow the checklist above while logged in
2. **Verify Cloudinary Uploads**: Check Cloudinary dashboard to confirm images upload to correct folder
3. **Test Each Platform**: Create posts with videos from each supported platform
4. **Test Edge Cases**: Invalid URLs, very long URLs, special characters
5. **Performance Testing**: Upload multiple large images (close to 10MB limit)

