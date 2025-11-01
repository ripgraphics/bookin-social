"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditPostModal from './EditPostModal';

export interface Post {
  id: string;
  post_type: 'post' | 'photo' | 'article' | 'video';
  content: string;
  image_urls?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_id?: string;
}

interface PostCardProps {
  post: Post;
  user: {
    id?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    profile?: {
      avatar_url?: string;
    };
    avatar_url?: string;
  };
  currentUserId?: string;
  onPostDeleted?: () => void;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, user, currentUserId, onPostDeleted, onPostUpdated }: PostCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const userName = `${firstName} ${lastName}`.trim() || 'User';
  const avatarUrl = user.profile?.avatar_url || user.avatar_url;
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Check if current user owns this post
  const isOwner = currentUserId && (post.user_id === currentUserId || user.id === currentUserId);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await axios.delete(`/api/profile/posts/${post.id}`, {
        timeout: 30000,
      });

      console.log('[PostCard] Post deleted successfully:', response.data);
      toast.success('Post deleted successfully!');
      onPostDeleted?.();
    } catch (error: any) {
      console.error('[PostCard] Error deleting post:', error);

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.response) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete post';

        if (status === 401) {
          toast.error('Authentication failed. Please log in again.');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (status === 403) {
          toast.error('You do not have permission to delete this post.');
        } else if (status === 404) {
          toast.error('Post not found.');
        } else if (status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error(error.message || 'Failed to delete post. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setIsEditModalOpen(true)}
                        className="cursor-pointer"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

        <div className="mb-4">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Video Display */}
        {post.post_type === 'video' && post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <div className="relative w-full aspect-video bg-neutral-100">
              <iframe
                src={post.image_urls[0]}
                title="Video embed"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Image Display (for photo posts or posts with images) */}
        {post.post_type !== 'video' && post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-4 rounded-lg overflow-hidden">
            {post.image_urls.length === 1 ? (
              // Single image
              <div className="relative w-full aspect-video">
                <img
                  src={post.image_urls[0]}
                  alt="Post image"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              // Multiple images - grid layout
              <div className="grid grid-cols-2 gap-2">
                {post.image_urls.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className={`relative ${
                      post.image_urls.length === 2 || (post.image_urls.length === 3 && index === 0)
                        ? 'col-span-2'
                        : 'aspect-square'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {index === 3 && post.image_urls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{post.image_urls.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span>{post.likes_count || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count || 0}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span>{post.shares_count || 0}</span>
          </Button>
        </div>
      </CardContent>
    </Card>

    <EditPostModal
      post={post}
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onPostUpdated={() => {
        setIsEditModalOpen(false);
        onPostUpdated?.();
      }}
    />
    </>
  );
}

