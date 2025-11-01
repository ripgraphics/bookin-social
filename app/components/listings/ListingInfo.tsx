'use client'

import { IconType } from "react-icons";
import dynamic from "next/dynamic";
import ReactMarkdown from 'react-markdown';

import { SafeUser } from "@/app/types";

import Avatar from "../Avatar";
import ListingCategory from "./ListingCategory";

const Map = dynamic(() => import('../Map'), { 
    ssr: false 
});

interface ListingInfoProps {
    user: SafeUser;
    description: string | null;
    guestCount: number | null;
    roomCount: number | null;
    bathroomCount: number | null;
    category: {
        icon: IconType;
        label: string;
        description: string;
    } | undefined;
    // New address fields
    formattedAddress?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    stateProvince?: string | null;
    postalCode?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    // Legacy field (for backward compatibility)
    locationValue?: string | null;
}

const ListingInfo: React.FC<ListingInfoProps> = ({
    user,
    description,
    guestCount,
    roomCount,
    bathroomCount,
    category,
    formattedAddress,
    addressLine1,
    addressLine2,
    city,
    stateProvince,
    postalCode,
    country,
    latitude,
    longitude,
    locationValue // Legacy field
}) => {
    // Get coordinates from new address fields or fallback to legacy
    const getCoordinates = () => {
        if (latitude && longitude) {
            return [latitude, longitude];
        }
        // Legacy fallback would need useCountries, but we'll handle this in the Map component
        return undefined;
    };

    const coordinates = getCoordinates();

    return (
        <div className="col-span-4 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div
                    className="
                        text-xl
                        font-semibold
                        flex
                        flex-row
                        items-center
                        gap-2
                    "
                >
                    <div>Hosted by {user?.firstName} {user?.lastName}</div>
                    <Avatar src={user?.avatar_url} />
                </div>
                <div
                    className="
                        flex
                        flex-row
                        items-center
                        gap-4
                        font-light
                        text-neutral-500
                    "
                >
                    <div>
                        {guestCount} guests |
                    </div>
                    <div>
                        {roomCount} rooms |
                    </div>
                    <div>
                        {bathroomCount} bathrooms
                    </div>
                </div>
            </div>
            <hr />
            {category && (
                <ListingCategory
                    icon={category.icon}
                    label={category.label}
                    description={category.description}
                />            
            )}
            <hr />
            <div className="text-lg font-light text-neutral-500 prose prose-neutral max-w-none prose-p:my-4">
                <ReactMarkdown>
                    {description || ''}
                </ReactMarkdown>
            </div>
            <hr />
            {/* Address Information */}
            {(formattedAddress || addressLine1 || city) && (
                <div className="flex flex-col gap-2">
                    <div className="text-lg font-semibold">Where you&apos;ll be</div>
                    <div className="text-neutral-600">
                        {formattedAddress ? (
                            <div>{formattedAddress}</div>
                        ) : (
                            <div>
                                {addressLine1 && <div>{addressLine1}</div>}
                                {addressLine2 && <div>{addressLine2}</div>}
                                <div>
                                    {city && stateProvince && `${city}, ${stateProvince}`}
                                    {city && !stateProvince && city}
                                    {!city && stateProvince && stateProvince}
                                </div>
                                {postalCode && <div>{postalCode}</div>}
                                {country && <div>{country}</div>}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <hr />
            <Map center={coordinates} />
        </div>
    )
}

export default ListingInfo