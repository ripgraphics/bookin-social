"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageIcon, FileText, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import CustomImageUpload from '@/app/components/inputs/CustomImageUpload';
import VideoLinkInput from '@/app/components/inputs/VideoLinkInput';

interface CreatePostCardProps {
  onPostCreated?: () => void;
}

export default function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'post' | 'photo' | 'video' | 'article'>('post');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo'); // Sub-selection for Photos/Video
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.MouseEvent) => {
    // Prevent any default form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!content.trim() && imageUrls.length === 0 && !videoUrl) {
      toast.error('Please enter some content or upload media');
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
          // If media type selected but no media provided, allow text-only post
          finalPostType = postType;
          finalImageUrls = [];
        }
      }

      const requestPayload = {
        post_type: finalPostType,
        content: content.trim(),
        image_urls: finalImageUrls,
      };
      
      const response = await axios.post('/api/profile/posts', requestPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });
      
      toast.success('Post created successfully!');
      setContent('');
      setImageUrls([]);
      setVideoUrl('');
      setPostType('post');
      setMediaType('photo');
      onPostCreated?.();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[CreatePostCard] Error:', error.message);
      }
      
      // Handle network errors specifically
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.response) {
        // Server responded with error status
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message || 'Failed to create post';
        
        // Handle specific status codes
        if (status === 401) {
          toast.error('Authentication failed. Please log in again.');
          // Optionally redirect to login after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (status === 404) {
          toast.error('User not found. Please contact support.');
        } else if (status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage);
        }
      } else if (error.request) {
        // Request was made but no response received (timeout)
        toast.error('Request timed out. Please try again.');
      } else {
        // Request was made but no response received
        toast.error(error.message || 'Failed to create post. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
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
                  placeholder="Paste video link (YouTube, Vimeo, Dailymotion, TikTok)..."
                  label="Video Link"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-5 items-center justify-between">
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
                setMediaType('photo'); // Reset media type
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
          <Button 
            type="button"
            onClick={(e) => handleSubmit(e)} 
            disabled={isSubmitting || (!content.trim() && imageUrls.length === 0 && !videoUrl)}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

