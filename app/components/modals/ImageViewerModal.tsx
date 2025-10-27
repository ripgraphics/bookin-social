'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { IoMdClose } from 'react-icons/io';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { getOptimizedCloudinaryUrl, CLOUDINARY_SIZES } from '@/lib/cloudinary';

interface ImageViewerModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
        aria-label="Close"
      >
        <IoMdClose size={32} />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 text-white text-sm font-semibold z-10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-4 text-white hover:text-gray-300 transition z-10"
          aria-label="Previous image"
        >
          <MdNavigateBefore size={48} />
        </button>
      )}

      {/* Image Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full">
          <Image
            src={getOptimizedCloudinaryUrl(images[currentIndex], CLOUDINARY_SIZES.hero)}
            fill
            className="object-contain"
            alt={`Image ${currentIndex + 1}`}
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 text-white hover:text-gray-300 transition z-10"
          aria-label="Next image"
        >
          <MdNavigateNext size={48} />
        </button>
      )}

      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90%] z-10">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition ${
              idx === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Image
              src={getOptimizedCloudinaryUrl(img, CLOUDINARY_SIZES.thumbnail)}
              fill
              className="object-cover"
              alt={`Thumbnail ${idx + 1}`}
              sizes="64px"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageViewerModal;

