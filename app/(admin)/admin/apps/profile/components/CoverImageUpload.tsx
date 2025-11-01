"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import CustomImageUpload from '@/app/components/inputs/CustomImageUpload';
import Image from 'next/image';

interface CoverImageUploadProps {
  currentCoverUrl?: string | null;
  onCoverChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function CoverImageUpload({
  currentCoverUrl,
  onCoverChange,
  disabled = false,
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (url: string) => {
    setIsUploading(true);
    try {
      onCoverChange(url);
    } catch (error) {
      console.error('Error updating cover image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = () => {
    onCoverChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Cover Image Display */}
      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
        {currentCoverUrl ? (
          <Image
            src={currentCoverUrl}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No cover image</p>
            </div>
          </div>
        )}

        {/* Upload overlay */}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-center text-white">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Change cover image</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="space-y-2">
        <CustomImageUpload
          value={currentCoverUrl || ''}
          onChange={handleImageUpload}
          disabled={disabled || isUploading}
          maxSizeMB={10}
          maxFiles={1}
          aspectRatio="21:9"
          uploadFolder="userProfileCover"
          className="w-full"
        />

        {/* Remove button */}
        {currentCoverUrl && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveCover}
            disabled={isUploading}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Remove Cover Image
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

