import getCurrentUser from "./actions/getCurrentUser";
import getListings, { IListingsParams } from "./actions/getListings";

import ClientOnly from "./components/ClientOnly";
import Container from "@/app/components/Container";
import EmptyState from "@/app/components/EmptyState";
import ListingCard from "./components/listings/ListingCard";

interface HomeProps {
  searchParams: Promise<IListingsParams>
}

const Home = async ({ searchParams }: HomeProps) => {
  const resolvedSearchParams = await searchParams;
  let userId: string | undefined = undefined;
  if (resolvedSearchParams && resolvedSearchParams.userId) {
    userId = resolvedSearchParams.userId;
  }
  // Fetch listings and user in parallel for better performance
  const [listings, currentUser] = await Promise.all([
    getListings({ ...resolvedSearchParams, userId }),
    getCurrentUser()
  ]);

  if (listings.length === 0) {
    return (
      <ClientOnly>
        <EmptyState showReset />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <Container>
        <div className="
          pt-24
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-4
          xl:grid-cols-5
          2xl:grid-cols-6
          gap-8
        ">
          {listings.map((listing) => {
            return (
              <ListingCard
                currentUser={currentUser}
                key={listing.id}
                data={listing}
              />
            )
          })}
        </div>
      </Container>
    </ClientOnly>
  )
}

export default Home;