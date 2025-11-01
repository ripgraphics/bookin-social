
import getCurrentUser from "@/app/actions/getCurrentUser";
import getListingById from "@/app/actions/getListingById";
import getReservations from "@/app/actions/getReservations";
import getListingAmenities, { groupAmenitiesByCategory } from "@/app/actions/getListingAmenities";

import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";

import ListingClient from "./ListingClient";

interface IParams {
  listingId?: string;
}

const ListingPage = async ({ params }: { params: Promise<IParams> }) => {
  const resolvedParams = await params;
  const listing = await getListingById(resolvedParams);
  const reservations = await getReservations(resolvedParams);
  const currentUser = await getCurrentUser();

  if (!listing) {
    return (
      <ClientOnly>
        <EmptyState />
      </ClientOnly>
    );
  }

  // Fetch amenities for this listing
  const listingAmenities = await getListingAmenities(listing.id);
  const groupedAmenities = groupAmenitiesByCategory(listingAmenities);

  return (
    <ClientOnly>
      <ListingClient
        listing={listing}
        reservations={reservations}
        currentUser={currentUser}
        amenities={groupedAmenities}
      />
    </ClientOnly>
  );
}
 
export default ListingPage;