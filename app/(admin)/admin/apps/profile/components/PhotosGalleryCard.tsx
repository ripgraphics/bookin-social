"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import ImageViewerModal from '@/app/components/modals/ImageViewerModal';
import CustomImageUpload from '@/app/components/inputs/CustomImageUpload';

interface Photo {
  id: string;
  image_url: string;
  caption?: string;
  created_at: string;
  updated_at?: string;
}

interface PhotosGalleryCardProps {
  canUpload?: boolean;
}

export default function PhotosGalleryCard({ canUpload = true }: PhotosGalleryCardProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Get user ID from Supabase auth
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Get public.users.id from auth_user_id
        supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setUserId(data.id);
            } else {
              console.error('Error getting user ID:', error);
              toast.error('Failed to load user information');
            }
          });
      }
    });
  }, []);

  // Fetch photos and set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    setLoading(true);

    // Initial fetch
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
        toast.error('Failed to load photos');
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    };

    fetchPhotos();

    // Set up real-time subscription
    const channel = supabase
      .channel(`user_photos:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_photos',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPhotos((prev) => [payload.new as Photo, ...prev]);
            toast.success('Photo added');
          } else if (payload.eventType === 'UPDATE') {
            setPhotos((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Photo) : p))
            );
            toast.success('Photo updated');
          } else if (payload.eventType === 'DELETE') {
            setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id));
            toast.success('Photo deleted');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setIsViewerOpen(true);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('user_photos').delete().eq('id', photoId);

      if (error) {
        throw error;
      }
      // Real-time subscription will handle UI update
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleEditCaption = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditCaption(photo.caption || '');
    setIsEditModalOpen(true);
  };

  const handleSaveCaption = async () => {
    if (!editingPhoto) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_photos')
        .update({ caption: editCaption })
        .eq('id', editingPhoto.id);

      if (error) {
        throw error;
      }

      setIsEditModalOpen(false);
      setEditingPhoto(null);
      setEditCaption('');
      // Real-time subscription will handle UI update
    } catch (error: any) {
      console.error('Error updating caption:', error);
      toast.error('Failed to update caption');
    }
  };

  const handleUploadComplete = async (urls: string | string[]) => {
    const urlsArray = Array.isArray(urls) ? urls : [urls];
    setUploadedUrls(urlsArray);
    setIsUploading(true);

    try {
      // Call API route to create photo records (requires server-side user ID resolution)
      const response = await fetch('/api/profile/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_urls: urlsArray,
          captions: [],
          album_name: 'default',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save photos');
      }

      setIsUploadModalOpen(false);
      setUploadedUrls([]);
      setIsUploading(false);
      // Real-time subscription will handle UI update automatically
    } catch (error: any) {
      console.error('Error saving photos:', error);
      toast.error(error.message || 'Failed to save photos');
      setIsUploading(false);
    }
  };

  // Convert photos to image URLs array for ImageViewerModal
  const imageUrls = photos.map((photo) => photo.image_url);

  // Show first 9 photos in a 3x3 grid
  const displayPhotos = photos.slice(0, 9);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading photos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Photos</CardTitle>
          {canUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayPhotos.length > 0 ? (
            <>
              <div className="grid grid-cols-12 gap-5">
                {displayPhotos.map((photo, index) => (
                  <div key={photo.id} className="md:col-span-4 sm:col-span-6 col-span-4 relative group">
                    <div
                      className="relative aspect-square rounded-md overflow-hidden cursor-pointer"
                      onClick={() => openViewer(photos.findIndex((p) => p.id === photo.id))}
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.caption || `Photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* Hover overlay with actions */}
                      {canUpload && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCaption(photo);
                            }}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Edit caption"
                          >
                            <Edit2 className="h-4 w-4 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id);
                            }}
                            className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            title="Delete photo"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Caption */}
                    {photo.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate" title={photo.caption}>
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {photos.length > 9 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => openViewer(0)}>
                    View All ({photos.length})
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No photos yet. Upload your first photo!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      {isViewerOpen && imageUrls.length > 0 && (
        <ImageViewerModal
          images={imageUrls}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          initialIndex={viewerIndex}
        />
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Upload photos to your gallery. Photos will be visible to others based on your privacy settings.
            </DialogDescription>
          </DialogHeader>
          <CustomImageUpload
            value={uploadedUrls}
            onChange={handleUploadComplete}
            multiple={true}
            maxFiles={10}
            uploadFolder="userProfileAlbum"
            aspectRatio="1:1"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Caption Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
            <DialogDescription>Update the caption for this photo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Enter a caption..."
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCaption}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
