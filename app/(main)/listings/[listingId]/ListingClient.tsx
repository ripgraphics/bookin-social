'use client';

import { Range } from "react-date-range";
import { toast } from "react-hot-toast";
import axios from "axios";
import { eachDayOfInterval, differenceInCalendarDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import { SafeListing, SafeReservation, SafeUser } from "@/app/types";
import { categories } from "@/app/components/navbar/Categories";
import Container from "@/app/components/Container";
import ListingHead from "@/app/components/listings/ListingHead";
import ListingInfo from "@/app/components/listings/ListingInfo";
import ListingReservation from "@/app/components/listings/ListingReservation";
import ListingAmenities from "@/app/components/listings/ListingAmenities";

import useLoginModal from "@/app/hooks/useLoginModal";
import useEditModal from "@/app/hooks/useEditModal";
import { HiDotsVertical } from "react-icons/hi";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { canEditListing, canDeleteListing } from "@/app/utils/permissions";

const initialDateRange = {
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
};

interface ListingClientProps {
    reservations?: SafeReservation[];
    listing: SafeListing & {
        user: SafeUser
    };
    currentUser?: SafeUser | null;
    amenities?: any[];
}

const ListingClient: React.FC<ListingClientProps> = ({
    listing,
    reservations = [],
    currentUser,
    amenities = []
}) => {
    const loginModal = useLoginModal();
    const editModal = useEditModal();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [showDropdown, setShowDropdown] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check permissions using RBAC system
    const listingOwnerId = listing.user_id || listing.userId || '';
    const canEdit = canEditListing(currentUser, listingOwnerId);
    const canDelete = canDeleteListing(currentUser, listingOwnerId);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEdit = () => {
        setShowDropdown(false);
        editModal.onOpen(listing.id);
    };

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this listing?')) {
            return;
        }

        setIsDeleting(true);
        setShowDropdown(false);

        axios.delete(`/api/listings/${listing.id}`)
            .then(() => {
                toast.success('Listing deleted successfully!');
                router.push('/');
                router.refresh();
            })
            .catch((error) => {
                toast.error('Failed to delete listing');
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };

    const disabledDates = useMemo(() => {
        let dates: Date[] = [];

        reservations.forEach((reservation) => {
            const range = eachDayOfInterval({
                start: new Date(reservation.startDate),
                end: new Date(reservation.endDate)
            });

            dates = [...dates, ...range];
        });

        return dates;
    }, [reservations]);

    const [isLoading, setIsLoading] = useState(false);
    const [totalPrice, setTotalPrice] = useState(listing.price);
    const [dateRange, setDateRange] = useState<Range>(initialDateRange);

    const onCreateReservation = useCallback(() => {
        if (!currentUser) {
            return loginModal.onOpen();           
        }

        setIsLoading(true);

        axios.post('/api/reservations', {
            totalPrice,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            listingId: listing.id
        })
        .then(() => {
            toast.success('Reservation created successfully!');
            setDateRange(initialDateRange);
            router.push('/trips');
        })
        .catch((error) => {
            toast.error('Something went wrong.');
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, [
        totalPrice,
        dateRange,
        listing?.id,
        router,
        currentUser,
        loginModal
    ]);

    useEffect(() => {
        if (dateRange.startDate && dateRange.endDate) { 
            const dayCount = differenceInCalendarDays(
                dateRange.endDate,
                dateRange.startDate
            );

            if (dayCount && listing.price) {
                setTotalPrice(dayCount * listing.price);
            } else {
                setTotalPrice(listing.price);
            }
        }
    }, [dateRange, listing.price]);

    const category = useMemo(() => {
        return categories.find((item) =>
        item.label === listing.category);
    }, [listing.category]);

    return (
        <Container>
            <div className="max-w-screen-lg mx-auto">
                <div className="flex flex-col gap-6">
                    {/* Actions Dropdown Menu */}
                    {canEdit && (
                        <div className="flex justify-end">
                            <div className="relative" ref={dropdownRef}>
                                {/* 3-Dot Vertical Icon Button */}
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    disabled={isDeleting}
                                    className="
                                        p-2
                                        hover:bg-neutral-100
                                        rounded-full
                                        transition
                                        cursor-pointer
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                    "
                                    aria-label="Listing actions"
                                >
                                    <HiDotsVertical size={24} className="text-neutral-600" />
                                </button>

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div className="
                                        absolute
                                        right-0
                                        mt-2
                                        w-48
                                        bg-white
                                        rounded-lg
                                        shadow-lg
                                        border
                                        border-neutral-200
                                        py-1
                                        z-50
                                    ">
                                        {/* Edit Option */}
                                        <button
                                            onClick={handleEdit}
                                            className="
                                                w-full
                                                px-4
                                                py-3
                                                text-left
                                                hover:bg-neutral-50
                                                transition
                                                flex
                                                items-center
                                                gap-3
                                                text-neutral-700
                                            "
                                        >
                                            <AiOutlineEdit size={20} />
                                            <span className="font-medium">Edit Listing</span>
                                        </button>

                                        {/* Divider */}
                                        <div className="border-t border-neutral-200 my-1" />

                                        {/* Delete Option */}
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="
                                                w-full
                                                px-4
                                                py-3
                                                text-left
                                                hover:bg-red-50
                                                transition
                                                flex
                                                items-center
                                                gap-3
                                                text-red-600
                                                disabled:opacity-50
                                                disabled:cursor-not-allowed
                                            "
                                        >
                                            <AiOutlineDelete size={20} />
                                            <span className="font-medium">
                                                {isDeleting ? 'Deleting...' : 'Delete Listing'}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <ListingHead
                        title={listing.title}
                        imageSrc={listing.imageSrc}
                        formattedAddress={listing.formatted_address}
                        city={listing.city}
                        stateProvince={listing.state_province}
                        country={listing.country}
                        locationValue={listing.locationValue}
                        id={listing.id}
                        currentUser={currentUser}
                    />
                    <div className="
                        grid
                        grid-cols-1
                        md:grid-cols-7
                        md:gap-6
                        mt-6
                    ">
                        <ListingInfo
                            user={listing.user}
                            category={category}
                            description={listing.description}
                            roomCount={listing.roomCount}
                            guestCount={listing.guestCount}
                            bathroomCount={listing.bathroomCount}
                            formattedAddress={listing.formatted_address}
                            addressLine1={listing.address_line1}
                            addressLine2={listing.address_line2}
                            city={listing.city}
                            stateProvince={listing.state_province}
                            postalCode={listing.postal_code}
                            country={listing.country}
                            latitude={listing.latitude}
                            longitude={listing.longitude}
                            locationValue={listing.locationValue}
                        />
                        <div
                            className="
                                order-first
                                md-10
                                md:order-last
                                md:col-span-3
                            "
                        >
                            <ListingReservation
                                price={listing.price}
                                totalPrice={totalPrice}
                                onChangeDate={(value) => setDateRange(value)}
                                dateRange={dateRange}
                                onSubmit={onCreateReservation}
                                disabled={isLoading}
                                disabledDates={disabledDates}
                            />

                        </div>
                    </div>
                    
                    {/* Amenities Section */}
                    {amenities.length > 0 && (
                        <div className="mt-6">
                            <ListingAmenities amenities={amenities} />
                        </div>
                    )}
                </div>
            </div>
        </Container>
    );
}

export default ListingClient;