"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageIcon, FileText, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Post } from './PostCard';
import CustomImageUpload from '@/app/components/inputs/CustomImageUpload';
import VideoLinkInput from '@/app/components/inputs/VideoLinkInput';

interface EditPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
}

export default function EditPostModal({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}: EditPostModalProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'post' | 'photo' | 'video' | 'article'>('post');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update state when post changes
  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setPostType(post.post_type || 'post');
      
      // Set media based on post type
      if (post.post_type === 'video' && post.image_urls && post.image_urls.length > 0) {
        setMediaType('video');
        setVideoUrl(post.image_urls[0]);
        setImageUrls([]);
      } else if (post.post_type === 'photo' && post.image_urls && post.image_urls.length > 0) {
        setMediaType('photo');
        setImageUrls(post.image_urls);
        setVideoUrl('');
      } else {
        setMediaType('photo');
        setImageUrls([]);
        setVideoUrl('');
      }
    }
  }, [post]);

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!post) {
      toast.error('No post selected');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine final post_type and image_urls based on media selection
      let finalPostType = postType;
      let finalImageUrls: string[] = [];

      if (postType === 'photo' || postType === 'video') {
        if (mediaType === 'photo' && imageUrls.length > 0) {
          finalPostType = 'photo';
          finalImageUrls = imageUrls;
        } else if (mediaType === 'video' && videoUrl) {
          finalPostType = 'video';
          finalImageUrls = [videoUrl]; // Store video embed URL in image_urls[0]
        } else {
          // If media type selected but no media provided, keep existing or empty
          finalPostType = postType;
          finalImageUrls = post?.image_urls || [];
        }
      } else {
        // For 'post' or 'article' type, keep existing image_urls if any
        finalImageUrls = post?.image_urls || [];
      }

      const response = await axios.patch(`/api/profile/posts/${post.id}`, {
        content: content.trim(),
        post_type: finalPostType,
        image_urls: finalImageUrls,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      console.log('[EditPostModal] Post updated successfully:', response.data);
      toast.success('Post updated successfully!');
      onPostUpdated();
      onClose();
    } catch (error: any) {
      console.error('[EditPostModal] Error updating post:', error);

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.response) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message || 'Failed to update post';

        if (status === 401) {
          toast.error('Authentication failed. Please log in again.');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (status === 403) {
          toast.error('You do not have permission to edit this post.');
        } else if (status === 404) {
          toast.error('Post not found.');
        } else if (status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(error.message || 'Failed to update post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setImageUrls([]);
      setVideoUrl('');
      setPostType('post');
      setMediaType('photo');
      onClose();
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content and type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Share your thoughts"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="mb-3"
          />

          {/* Media Type Selection (shown when Photos/Video is selected) */}
          {(postType === 'photo' || postType === 'video') && (
            <div className="mb-3">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('photo');
                    setVideoUrl(''); // Clear video when switching to photos
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    mediaType === 'photo'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Upload Photos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('video');
                    setImageUrls([]); // Clear images when switching to video
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    mediaType === 'video'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Share Video Link
                </button>
              </div>

              {/* Image Upload */}
              {mediaType === 'photo' && (
                <div className="mb-3">
                  <CustomImageUpload
                    value={imageUrls}
                    onChange={(urls) => setImageUrls(Array.isArray(urls) ? urls : urls ? [urls] : [])}
                    disabled={isSubmitting}
                    maxSizeMB={10}
                    maxFiles={10}
                    multiple={true}
                    uploadFolder="userProfilePost"
                  />
                </div>
              )}

              {/* Video Link Input */}
              {mediaType === 'video' && (
                <div className="mb-3">
                  <VideoLinkInput
                    value={videoUrl}
                    onChange={setVideoUrl}
                    disabled={isSubmitting}
                    placeholder="Paste YouTube video link here..."
                    label="Video Link"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setPostType(postType === 'photo' || postType === 'video' ? 'post' : 'photo');
                setMediaType('photo');
              }}
              className={`flex items-center gap-2 cursor-pointer text-sm font-medium ${
                postType === 'photo' || postType === 'video' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Photos / Video
            </button>
            <button
              type="button"
              onClick={() => {
                setPostType('article');
                setMediaType('photo');
                setImageUrls([]);
                setVideoUrl('');
              }}
              className={`flex items-center gap-2 cursor-pointer text-sm font-medium ${
                postType === 'article' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              Article
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? 'Updating...' : 'Update Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

