"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TiptapEditor from "@/app/components/inputs/TiptapEditor";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  featured_image?: string;
  created_at: string;
}

interface BlogClientProps {
  currentUser: SafeUser | null;
}

export default function BlogClient({ currentUser }: BlogClientProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft"
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get("/api/blog/posts");
      setPosts(response.data);
    } catch (error: any) {
      toast.error("Failed to load posts");
    }
  };

  const createPost = async () => {
    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await axios.post("/api/blog/posts", { ...formData, slug });
      setIsNewPostOpen(false);
      setFormData({ title: "", content: "", status: "draft" });
      toast.success("Post created");
      fetchPosts();
    } catch (error: any) {
      toast.error("Failed to create post");
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`/api/blog/posts/${id}`);
      toast.success("Post deleted");
      fetchPosts();
    } catch (error: any) {
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-gray-600">Create and manage blog content</p>
        </div>
        <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Post title"
                />
              </div>
              <div>
                <TiptapEditor
                  id="content"
                  label="Content"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Write your post content..."
                  errors={{}}
                />
              </div>
              <Button onClick={createPost} className="w-full">
                Create Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
            {post.featured_image && (
              <div className="h-48 bg-gray-200">
                <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                  {post.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2">{post.title}</h3>
              <div className="prose prose-sm line-clamp-3 text-gray-600 mb-4">
                {post.content.substring(0, 150)}...
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

