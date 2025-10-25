'use client';

import Image from "next/image";

import { SafeUser } from "@/app/types";
import { getOptimizedCloudinaryUrl, CLOUDINARY_SIZES } from '@/lib/cloudinary';

import Heading from "../Heading";
import HeartButton from "../HeartButton";

interface ListingHeadProps {
  title: string;
  // New address fields
  formattedAddress?: string | null;
  city?: string | null;
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
  country,
  locationValue, // Legacy field
  imageSrc,
  id,
  currentUser
}) => {
  // Create display subtitle from new address fields
  const getLocationSubtitle = () => {
    // Use new address fields if available
    if (formattedAddress) {
      return formattedAddress;
    }
    
    // Fallback to city, country format
    if (city && country) {
      return `${city}, ${country}`;
    }
    
    // Legacy fallback to old locationValue
    if (locationValue) {
      return locationValue;
    }
    
    return 'Location not specified';
  };

  const locationSubtitle = getLocationSubtitle();

  // Get first image if array, ensure not null/empty
  const imageUrl = Array.isArray(imageSrc) 
    ? (imageSrc[0] || '') 
    : (imageSrc || '');

  return ( 
    <>
      <Heading
        title={title}
        subtitle={locationSubtitle}
      />
      <div className="
          w-full
          h-[60vh]
          overflow-hidden 
          rounded-xl
          relative
        "
      >
        <Image
          src={imageUrl ? getOptimizedCloudinaryUrl(imageUrl, CLOUDINARY_SIZES.hero) : '/images/placeholder.jpg'}
          fill
          className="object-cover w-full"
          alt="Image"
          sizes="100vw"
        />
        <div
          className="
            absolute
            top-5
            right-5
          "
        >
          <HeartButton 
            listingId={id}
            currentUser={currentUser}
          />
        </div>
      </div>
    </>
   );
}
 
export default ListingHead;