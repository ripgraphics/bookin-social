'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { format } from 'date-fns';

import { 
  SafeListing, 
  SafeReservation, 
  SafeUser 
} from "@/app/types";
import { getOptimizedCloudinaryUrl, CLOUDINARY_SIZES } from '@/lib/cloudinary';

import HeartButton from "../HeartButton";
import Button from "../Button";
import ClientOnly from "../ClientOnly";

interface ListingCardProps {
  data: SafeListing;
  reservation?: SafeReservation;
  onAction?: (id: string) => void;
  disabled?: boolean;
  actionLabel?: string;
  actionId?: string;
  currentUser?: SafeUser | null
};

const ListingCard: React.FC<ListingCardProps> = ({
  data,
  reservation,
  onAction,
  disabled,
  actionLabel,
  actionId = '',
  currentUser,
}) => {
  const router = useRouter();

  // Get location display from new address fields
  const getLocationDisplay = () => {
    // Show only state/province if available
    if (data.stateProvince) {
      return data.stateProvince;
    }
    
    // Fallback to city if state not available
    if (data.city) {
      return data.city;
    }
    
    // Fallback to country
    if (data.country) {
      return data.country;
    }
    
    return 'Location not specified';
  };

  const locationDisplay = getLocationDisplay();

  const handleCancel = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (disabled) {
      return;
    }

    onAction?.(actionId)
  }, [disabled, onAction, actionId]);

  const price = useMemo(() => {
    if (reservation) {
      return reservation.totalPrice;
    }

    return data.price;
  }, [reservation, data.price]);

  const reservationDate = useMemo(() => {
    if (!reservation) {
      return null;
    }
  
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);

    return `${format(start, 'PP')} - ${format(end, 'PP')}`;
  }, [reservation]);

  // Get first image if array, ensure not null/empty
  const imageUrl = Array.isArray(data.imageSrc) 
    ? (data.imageSrc[0] || '') 
    : (data.imageSrc || '');

  return (
    <div 
      onClick={() => router.push(`/listings/${data.id}`)} 
      className="col-span-1 cursor-pointer group"
    >
      <div className="flex flex-col gap-2 w-full">
        <div 
          className="
            aspect-video 
            w-full 
            relative 
            overflow-hidden 
            rounded-xl
          "
        >
          <Image
            fill
            className="
              object-cover 
              h-full 
              w-full 
              group-hover:scale-110 
              transition
            "
            src={imageUrl ? getOptimizedCloudinaryUrl(imageUrl, CLOUDINARY_SIZES.card) : '/images/placeholder.jpg'}
            alt="Listing"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="
            absolute
            top-3
            right-3
          ">
            <HeartButton 
              listingId={data.id} 
              currentUser={currentUser}
            />
          </div>
        </div>
        <div className="font-semibold text-base">
          {locationDisplay}
        </div>
        <div className="font-light text-neutral-500">
          {reservationDate || data.category}
        </div>
        <div className="flex flex-row items-center gap-1">
          <div className="font-semibold">
            $ {price}
          </div>
          {!reservation && (
            <div className="font-light">night</div>
          )}
        </div>
        {onAction && actionLabel && (
          <Button
            disabled={disabled}
            small
            label={actionLabel} 
            onClick={handleCancel}
          />
        )}
      </div>
    </div>
   );
}
 
export default ListingCard;