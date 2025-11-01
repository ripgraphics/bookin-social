"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import CustomImageUpload from '@/app/components/inputs/CustomImageUpload';

interface ProfileImageUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  onAvatarChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function ProfileImageUpload({
  currentAvatarUrl,
  userName = '',
  onAvatarChange,
  disabled = false,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (url: string) => {
    setIsUploading(true);
    try {
      onAvatarChange(url);
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange(null);
  };

  const getInitials = () => {
    if (!userName) return 'U';
    const names = userName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentAvatarUrl || undefined} alt="Profile" />
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="space-y-2">
        <div className="space-y-2">
          <CustomImageUpload
            value={currentAvatarUrl || ''}
            onChange={handleImageUpload}
            disabled={disabled || isUploading}
            maxSizeMB={5}
            maxFiles={1}
            aspectRatio="1:1"
            uploadFolder="userAvatar"
            className="w-full"
          />
        </div>

        {/* Remove button */}
        {currentAvatarUrl && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Remove Avatar
          </Button>
        )}

        {/* Upload status */}
        {isUploading && (
          <p className="text-sm text-gray-500">Uploading...</p>
        )}
      </div>
    </div>
  );
}

