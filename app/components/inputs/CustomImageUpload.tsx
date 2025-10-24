'use client';

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { TbPhotoPlus, TbTrash, TbLoader, TbX, TbCheck } from 'react-icons/tb';
import toast from 'react-hot-toast';
import { CLOUDINARY_FOLDERS, CloudinaryFolderType } from '@/lib/cloudinary';

export interface CustomImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  multiple?: boolean;
  acceptedFormats?: string[];
  aspectRatio?: '16:9' | '1:1' | '4:3' | 'auto';
  uploadFolder?: CloudinaryFolderType;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  url?: string;
  preview: string;
}

const CustomImageUpload: React.FC<CustomImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
  maxSizeMB = 10,
  maxFiles = 1,
  multiple = false,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  aspectRatio = '16:9',
  uploadFolder = 'listings',
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadQueueRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  const CLOUDINARY_UPLOAD_PRESET = 'bookin_uploads';
  const CLOUDINARY_CLOUD_NAME = 'dnjuiwsnr';
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Get current images as array
  const currentImages = Array.isArray(value) ? value : value ? [value] : [];

  // Get aspect ratio style
  const getAspectRatioStyle = () => {
    if (aspectRatio === 'auto') return {};
    return { aspectRatio };
  };

  // Auto-scroll to active upload (unless user has manually scrolled)
  useEffect(() => {
    if (!userHasScrolled && activeItemRef.current && uploadQueueRef.current) {
      activeItemRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [uploadQueue, userHasScrolled]);

  // Detect manual scroll
  const handleQueueScroll = () => {
    setUserHasScrolled(true);
    // Reset after 3 seconds
    setTimeout(() => setUserHasScrolled(false), 3000);
  };

  // Validate files before upload
  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const fileArray = Array.from(files);
    const valid: File[] = [];
    const errors: string[] = [];

    // Check total count
    const newTotal = currentImages.length + fileArray.length;
    if (newTotal > maxFiles) {
      errors.push(`Maximum ${maxFiles} images allowed. You have ${currentImages.length}, trying to add ${fileArray.length}.`);
      return { valid, errors };
    }

    // Validate each file
    fileArray.forEach(file => {
      // Check file type
      if (!acceptedFormats.includes(file.type)) {
        errors.push(`Invalid file type: ${file.name}`);
        return;
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        errors.push(`File too large: ${file.name} (Max: ${maxSizeMB}MB)`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  // Upload single file to Cloudinary
  const uploadToCloudinary = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const folderPath = CLOUDINARY_FOLDERS[uploadFolder];
    formData.append('folder', folderPath);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          onProgress(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload network error'));
      });

      xhr.open('POST', CLOUDINARY_UPLOAD_URL);
      xhr.send(formData);
    });
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList) => {
    if (disabled || uploading) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    if (valid.length === 0) return;

    // Create upload queue items
    const newItems: UploadItem[] = valid.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const,
      preview: URL.createObjectURL(file),
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    setUploading(true);

    // Upload files sequentially
    const uploadedUrls: string[] = [];
    for (const item of newItems) {
      try {
        // Update status to uploading
        setUploadQueue(prev => 
          prev.map(i => i.id === item.id ? { ...i, status: 'uploading' as const } : i)
        );

        const url = await uploadToCloudinary(item.file, (progress) => {
          setUploadQueue(prev =>
            prev.map(i => i.id === item.id ? { ...i, progress } : i)
          );
        });

        uploadedUrls.push(url);

        // Update status to complete
        setUploadQueue(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'complete' as const, url } : i)
        );

        // Clean up preview URL
        URL.revokeObjectURL(item.preview);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadQueue(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'error' as const } : i)
        );
        toast.error(`Failed to upload ${item.file.name}`);
      }
    }

    // Update parent component with all uploaded URLs
    if (uploadedUrls.length > 0) {
      const newImages = [...currentImages, ...uploadedUrls];
      onChange(multiple ? newImages : newImages[newImages.length - 1]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    }

    setUploading(false);
    setUploadQueue([]);
  };

  // Handle file input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Handle drag & drop
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Handle remove image
  const handleRemove = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    onChange(multiple ? newImages : '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  // Check if we can add more images
  const canAddMore = currentImages.length < maxFiles;
  const remainingSlots = maxFiles - currentImages.length;

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled || uploading || !canAddMore}
        className="hidden"
      />

      {/* Uploaded Images Grid - Fixed 2-Row Scrollable */}
      {currentImages.length > 0 && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900">
              {currentImages.length} {currentImages.length === 1 ? 'image' : 'images'} uploaded
            </div>
            {multiple && (
              <div className="text-xs text-neutral-500">
                {currentImages.length}/{maxFiles}
              </div>
            )}
          </div>

          {/* Fixed 2-Row Horizontal Scrollable Grid */}
          <div className="relative">
            <div 
              className={`
                grid gap-2 overflow-x-auto pb-2
                scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100
                ${multiple 
                  ? 'grid-rows-2 auto-cols-[minmax(140px,1fr)] md:auto-cols-[minmax(180px,1fr)] grid-flow-col' 
                  : 'grid-cols-1'
                }
              `}
              style={{
                maxHeight: multiple ? '320px' : 'auto',
              }}
            >
              {currentImages.map((url, index) => (
                <div
                  key={url}
                  className="relative group rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-blue-500 transition-all duration-200"
                  style={getAspectRatioStyle()}
                >
                  {/* Image */}
                  <Image
                    src={url}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    alt={`Uploaded image ${index + 1}`}
                    sizes="(max-width: 768px) 140px, 180px"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                  
                  {/* Remove Button */}
                  {!disabled && (
                    <button
                      onClick={() => handleRemove(index)}
                      type="button"
                      className="
                        absolute top-2 right-2 
                        p-1.5 bg-red-500 text-white rounded-full 
                        hover:bg-red-600 transition-all duration-200 
                        opacity-0 group-hover:opacity-100
                        shadow-lg z-10
                        md:p-1.5 p-2 md:min-w-0 md:min-h-0 min-w-[44px] min-h-[44px]
                        flex items-center justify-center
                      "
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <TbTrash size={16} className="hidden md:block" />
                      <TbTrash size={20} className="md:hidden" />
                    </button>
                  )}

                  {/* Image Number Badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded-full">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Helper Text */}
            {multiple && currentImages.length > 8 && (
              <div className="text-xs text-neutral-500 text-center mt-2">
                ← Scroll horizontally to see all images →
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Queue (Uploading Images) */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white pb-2 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-900">
                Uploading {uploadQueue.filter(i => i.status === 'complete').length} of {uploadQueue.length}
              </div>
              <div className="text-xs text-neutral-500">
                {Math.round((uploadQueue.filter(i => i.status === 'complete').length / uploadQueue.length) * 100)}% complete
              </div>
            </div>
          </div>

          {/* Scrollable Queue */}
          <div 
            ref={uploadQueueRef}
            onScroll={handleQueueScroll}
            className="max-h-[300px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100"
          >
            {uploadQueue.map((item, index) => {
              const isActive = item.status === 'uploading';
              const isNext = item.status === 'pending' && uploadQueue.findIndex(i => i.status === 'uploading') === index - 1;
              
              return (
                <div
                  key={item.id}
                  ref={isActive ? activeItemRef : null}
                  className={`
                    flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg transition-all duration-200
                    ${isActive ? 'bg-blue-50 ring-2 ring-blue-500 ring-opacity-50' : ''}
                    ${isNext ? 'bg-neutral-50 border border-neutral-200' : ''}
                    ${item.status === 'complete' ? 'bg-green-50' : ''}
                    ${item.status === 'error' ? 'bg-red-50' : ''}
                    ${item.status === 'pending' && !isNext ? 'bg-neutral-50' : ''}
                  `}
                >
                  {/* Compact Thumbnail */}
                  <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={item.preview}
                      fill
                      className="object-cover"
                      alt={item.file.name}
                    />
                    {/* Status Overlay */}
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                        <TbLoader size={16} className="animate-spin text-blue-600 md:hidden" />
                        <TbLoader size={20} className="animate-spin text-blue-600 hidden md:block" />
                      </div>
                    )}
                  </div>

                  {/* File Info & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-xs md:text-sm font-medium text-neutral-900 truncate flex-1">
                        {item.file.name}
                      </div>
                      {item.status === 'complete' && (
                        <TbCheck size={16} className="text-green-600 flex-shrink-0" />
                      )}
                      {item.status === 'error' && (
                        <TbX size={16} className="text-red-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {/* Progress Bar */}
                    {(item.status === 'uploading' || item.status === 'pending') && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 bg-neutral-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${
                              isActive ? 'bg-blue-600' : 'bg-neutral-400'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500 w-8 md:w-10 text-right tabular-nums">
                          {item.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative
            cursor-pointer
            transition
            border-dashed 
            border-2 
            p-12
            flex
            flex-col
            justify-center
            items-center
            gap-3
            text-neutral-600
            rounded-lg
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-neutral-300'}
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-70'}
          `}
          style={aspectRatio !== 'auto' ? getAspectRatioStyle() : {}}
        >
          {uploading ? (
            <>
              <TbLoader size={40} className="animate-spin text-blue-500" />
              <div className="font-semibold text-base">Uploading...</div>
            </>
          ) : (
            <>
              <TbPhotoPlus size={40} />
              <div className="font-semibold text-base text-center">
                Click to upload or drag and drop
              </div>
              <div className="font-light text-sm text-neutral-500 text-center">
                {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} (Max {maxSizeMB}MB each)
              </div>
              {multiple && (
                <div className="font-medium text-sm text-blue-600">
                  {currentImages.length}/{maxFiles} images • {remainingSlots} remaining
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Max limit reached message */}
      {!canAddMore && (
        <div className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-sm font-medium text-neutral-700">
            Maximum limit reached ({maxFiles} images)
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Remove an image to upload a new one
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomImageUpload;
