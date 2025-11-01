"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ImageCropper from '@/app/components/modals/ImageCropper';
import { 
  Camera, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram,
  Image as ImageIcon,
  Users,
  UserPlus,
  User,
  Bell,
  Shield,
  Activity,
  Lock,
  Settings,
  Upload,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileHeaderProps {
  coverImageUrl?: string | null;
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  location?: string | null;
  jobTitle?: string | null;
  profileCompletionPercentage: number;
  isVerified?: boolean;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCoverChange: (url: string | null) => void;
  onAvatarChange: (url: string | null) => void;
}

export default function ProfileHeader({
  coverImageUrl,
  avatarUrl,
  firstName,
  lastName,
  email,
  location,
  jobTitle,
  profileCompletionPercentage,
  isVerified = false,
  postsCount = 0,
  followersCount = 0,
  followingCount = 0,
  socialLinks,
  activeTab,
  onTabChange,
  onCoverChange,
  onAvatarChange,
}: ProfileHeaderProps) {
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false);
  const [isCoverUploadOpen, setIsCoverUploadOpen] = useState(false);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);
  const [isCoverCropOpen, setIsCoverCropOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_UPLOAD_PRESET = 'bookin_uploads';
  const CLOUDINARY_CLOUD_NAME = 'dnjuiwsnr';
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const getInitials = () => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB for avatar, 10MB for cover)
    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${type === 'avatar' ? '5MB' : '10MB'}`);
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setSelectedImageSrc(src);
      if (type === 'avatar') {
        setIsAvatarCropOpen(true);
        setIsAvatarUploadOpen(false);
      } else {
        setIsCoverCropOpen(true);
        setIsCoverUploadOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload cropped image to Cloudinary
  // Note: Format conversion (f_webp,q_95) is handled by the upload preset configuration
  // Images are automatically stored as WebP format with 95% quality
  const uploadCroppedImage = async (blob: Blob, type: 'avatar' | 'cover'): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', type === 'avatar' ? 'user_profile/avatar' : 'user_profile/cover');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarCropComplete = async (croppedBlob: Blob) => {
    try {
      const url = await uploadCroppedImage(croppedBlob, 'avatar');
      onAvatarChange(url); // Update immediately - this fixes the refresh issue
      setIsAvatarCropOpen(false);
      setSelectedImageSrc('');
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const handleCoverCropComplete = async (croppedBlob: Blob) => {
    try {
      const url = await uploadCroppedImage(croppedBlob, 'cover');
      onCoverChange(url); // Update immediately - this fixes the refresh issue
      setIsCoverCropOpen(false);
      setSelectedImageSrc('');
      toast.success('Cover image updated successfully');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover image');
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange(null);
  };

  const handleRemoveCover = () => {
    onCoverChange(null);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Cover Image Container - EXACT aspect ratio 729:209 */}
      <div className="relative w-full aspect-[729/209] overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
            style={{ aspectRatio: '729 / 209' }}
          />
        )}
        
        {/* Edit Cover Dropdown */}
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 text-xs"
              >
                <Camera className="h-3 w-3 mr-1.5" />
                Edit Cover
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => coverFileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload new cover
              </DropdownMenuItem>
              {coverImageUrl && (
                <DropdownMenuItem onClick={handleRemoveCover} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove cover
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3-Column Grid Layout - Matches Matdash Template */}
      <div className="grid grid-cols-12 gap-3 p-6">
        {/* Column 1: Stats (LEFT) */}
        <div className="lg:col-span-4 col-span-12 lg:order-1 order-2">
          <div className="flex gap-6 items-center justify-around lg:py-0 py-4">
            {/* Posts */}
            <div className="text-center">
              <ImageIcon className="block mx-auto opacity-50 h-5 w-5 mb-2" style={{ color: 'rgb(31, 42, 61)' }} />
              <h4 className="text-xl font-semibold" style={{ color: 'rgb(31, 42, 61)' }}>{postsCount.toLocaleString()}</h4>
              <p className="text-sm" style={{ color: 'rgb(41, 52, 61)' }}>Posts</p>
            </div>
            
            {/* Followers */}
            <div className="text-center">
              <Users className="block mx-auto opacity-50 h-5 w-5 mb-2" style={{ color: 'rgb(31, 42, 61)' }} />
              <h4 className="text-xl font-semibold" style={{ color: 'rgb(31, 42, 61)' }}>{followersCount.toLocaleString()}</h4>
              <p className="text-sm" style={{ color: 'rgb(41, 52, 61)' }}>Followers</p>
            </div>
            
            {/* Following */}
            <div className="text-center">
              <UserPlus className="block mx-auto opacity-50 h-5 w-5 mb-2" style={{ color: 'rgb(31, 42, 61)' }} />
              <h4 className="text-xl font-semibold" style={{ color: 'rgb(31, 42, 61)' }}>{followingCount.toLocaleString()}</h4>
              <p className="text-sm" style={{ color: 'rgb(41, 52, 61)' }}>Following</p>
            </div>
          </div>
        </div>

        {/* Column 2: Name & Avatar (CENTER) */}
        <div className="lg:col-span-4 col-span-12 lg:order-2 order-1 flex flex-col items-center">
          {/* Avatar - overlaps cover image */}
          <div className="relative -mt-20 mb-4">
            <Avatar className="w-[100px] h-[100px] ring-4 ring-white shadow-lg">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center border-2 border-white shadow-sm transition-colors"
                  title="Edit Avatar"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => avatarFileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload new avatar
                </DropdownMenuItem>
                {avatarUrl && (
                  <DropdownMenuItem onClick={handleRemoveAvatar} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove avatar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Name & Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {firstName} {lastName}
          </h2>
          <p className="text-sm text-gray-600">{jobTitle || 'Designer'}</p>
        </div>

        {/* Column 3: Button & Social (RIGHT) */}
        <div className="lg:col-span-4 col-span-12 lg:order-3 order-3 flex flex-col items-center justify-center gap-4">
          {/* Social Icons */}
          <div className="flex gap-2">
            {socialLinks?.facebook && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                asChild
              >
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-4 h-4" />
                </a>
              </Button>
            )}
            {socialLinks?.twitter && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                asChild
              >
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
            )}
            {socialLinks?.instagram && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                asChild
              >
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4" />
                </a>
              </Button>
            )}
            {socialLinks?.linkedin && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9"
                asChild
              >
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
          
          {/* Primary Action Button */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
            Add To Story
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-t border-gray-200" style={{ backgroundColor: '#c00100' }}>
        <div className="flex justify-around py-0">
          <button
            onClick={() => onTabChange('profile')}
            className={`flex gap-2 items-center px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-white text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="md:block hidden">Profile</span>
          </button>
          <button
            onClick={() => onTabChange('notifications')}
            className={`flex gap-2 items-center px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-white text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="md:block hidden">Notifications</span>
          </button>
          <button
            onClick={() => onTabChange('security')}
            className={`flex gap-2 items-center px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-white text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="md:block hidden">Security</span>
          </button>
          <button
            onClick={() => onTabChange('activity')}
            className={`flex gap-2 items-center px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-white text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="md:block hidden">Activity</span>
          </button>
          <button
            onClick={() => onTabChange('privacy')}
            className={`flex gap-2 items-center px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-white text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span className="md:block hidden">Privacy</span>
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`flex gap-2 items-center px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-white text-white'
                : 'border-transparent text-white/80 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="md:block hidden">Settings</span>
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'avatar')}
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'cover')}
      />

      {/* Avatar Crop Dialog */}
      <Dialog open={isAvatarCropOpen} onOpenChange={(open) => {
        setIsAvatarCropOpen(open);
        if (!open) {
          setSelectedImageSrc('');
          if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Avatar</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the part of the image you want to use as your avatar. The avatar will be displayed as a circle.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedImageSrc && (
              <ImageCropper
                imageSrc={selectedImageSrc}
                onCropComplete={handleAvatarCropComplete}
                onCancel={() => {
                  setIsAvatarCropOpen(false);
                  setSelectedImageSrc('');
                  if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
                }}
                aspectRatio={1}
                cropShape="round"
                minWidth={100}
                minHeight={100}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Image Crop Dialog */}
      <Dialog open={isCoverCropOpen} onOpenChange={(open) => {
        setIsCoverCropOpen(open);
        if (!open) {
          setSelectedImageSrc('');
          if (coverFileInputRef.current) coverFileInputRef.current.value = '';
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop Cover Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the part of the image you want to use as your cover. Recommended aspect ratio: 16:9.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedImageSrc && (
              <ImageCropper
                imageSrc={selectedImageSrc}
                onCropComplete={handleCoverCropComplete}
                onCancel={() => {
                  setIsCoverCropOpen(false);
                  setSelectedImageSrc('');
                  if (coverFileInputRef.current) coverFileInputRef.current.value = '';
                }}
                aspectRatio={16 / 9}
                cropShape="rect"
                minWidth={400}
                minHeight={225}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
