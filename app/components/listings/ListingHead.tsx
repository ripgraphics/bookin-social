'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

import { SafeUser } from "@/app/types";
import { getOptimizedCloudinaryUrl, CLOUDINARY_SIZES } from '@/lib/cloudinary';

import Heading from "../Heading";
import HeartButton from "../HeartButton";
import ImageViewerModal from "../modals/ImageViewerModal";

interface ListingHeadProps {
  title: string;
  // New address fields
  formattedAddress?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  // Legacy field (for backward compatibility)
  locationValue?: string | null;
  imageSrc: string | string[]; // Can be string or array
  id: string;
  currentUser?: SafeUser | null
}

const ListingHead: React.FC<ListingHeadProps> = ({
  title,
  formattedAddress,
  city,
  stateProvince,
  country,
  locationValue, // Legacy field
  imageSrc,
  id,
  currentUser
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const openViewer = (index: number = 0) => {
    setViewerInitialIndex(index);
    setIsViewerOpen(true);
  };

  // Detect screen size for responsive behavior
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return;
    
    // Set initial value
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is Tailwind's md breakpoint
    };
    
    // Check on mount
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create display subtitle from new address fields
  const getLocationSubtitle = () => {
    // Show city and state if both available
    if (city && stateProvince) {
      return `${city}, ${stateProvince}`;
    }
    
    // Fallback to just city if state not available
    if (city) {
      return city;
    }
    
    // Fallback to formatted address if city not available
    if (formattedAddress) {
      return formattedAddress;
    }
    
    // Legacy fallback to old locationValue
    if (locationValue) {
      return locationValue;
    }
    
    return 'Location not specified';
  };

  const locationSubtitle = getLocationSubtitle();

  // Get images array (first 5 images)
  const images = Array.isArray(imageSrc) ? imageSrc : [imageSrc];
  const displayImages = images.slice(0, 5);

  // Pad with placeholder if less than 5 images
  while (displayImages.length < 5) {
    displayImages.push('/images/placeholder.jpg');
  }

  return ( 
    <>
      <Heading
        title={title}
        subtitle={locationSubtitle}
      />
      <div className={`w-full relative overflow-hidden rounded-xl flex ${!isMobile ? 'gap-0.5' : ''} bg-neutral-200`}>
        {/* Main Image at 16:9 aspect ratio - now clickable */}
        <button
          onClick={() => openViewer(0)}
          className={`relative ${isMobile ? 'w-full rounded-xl' : 'w-1/2 rounded-l-xl'} aspect-video overflow-hidden cursor-pointer`}
        >
          <Image 
            src={displayImages[0] ? getOptimizedCloudinaryUrl(displayImages[0], CLOUDINARY_SIZES.hero) : '/images/placeholder.jpg'}
            fill 
            className="object-cover hover:scale-105 transition-transform duration-300" 
            alt="Main listing image"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </button>
        
        {/* Right: 2x2 Grid of clickable thumbnails - only on desktop */}
        {!isMobile && (
          <div className="w-1/2 grid grid-cols-2 grid-rows-2 gap-0.5">
            {[1, 2, 3, 4].map((idx) => {
              const isTopRight = idx === 2;
              const isBottomRight = idx === 4;
              const roundedClass = isTopRight ? 'rounded-tr-xl' : isBottomRight ? 'rounded-br-xl' : '';
              
              return (
                <button
                  key={idx}
                  onClick={() => openViewer(idx)}
                  className={`relative aspect-video overflow-hidden cursor-pointer ${roundedClass}`}
                >
                  <Image 
                    src={displayImages[idx] ? getOptimizedCloudinaryUrl(displayImages[idx], CLOUDINARY_SIZES.thumbnail) : '/images/placeholder.jpg'}
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-300" 
                    alt={`Image ${idx + 1}`}
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </button>
              );
            })}
          </div>
        )}
        
        {/* Show All Photos Button - now functional */}
        <button 
          type="button"
          onClick={() => openViewer(0)}
          className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition flex items-center gap-2 text-sm font-semibold z-10"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 11.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-10-5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-10-5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
          </svg>
          Show all photos
        </button>
        
        {/* Heart Button */}
        <div className="absolute top-5 right-5 z-10">
          <HeartButton 
            listingId={id}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        images={displayImages}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        initialIndex={viewerInitialIndex}
      />
    </>
   );
}
 
export default ListingHead;