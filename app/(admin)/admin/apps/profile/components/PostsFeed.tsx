"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from './PostCard';
import { Post } from './PostCard';

interface PostsFeedProps {
  posts: Post[];
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

export default function PostsFeed({ posts, user, currentUserId, onPostDeleted, onPostUpdated }: PostsFeedProps) {
  const [filter, setFilter] = useState<'all' | 'photo' | 'article' | 'post'>('all');

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.post_type === filter;
  });

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts yet. Create your first post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="photo">Photos/Video</TabsTrigger>
          <TabsTrigger value="article">Article</TabsTrigger>
          <TabsTrigger value="post">Post</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            currentUserId={currentUserId}
            onPostDeleted={onPostDeleted}
            onPostUpdated={onPostUpdated}
          />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {filter === 'all' ? '' : filter} posts found.</p>
        </div>
      )}
    </div>
  );
}

