import Container from "../components/Container";
import EmptyState from "../components/EmptyState";
import getListings, { IListingsParams } from "../actions/getListings";
import ListingCard from "../components/listings/ListingCard";
import getCurrentUser from "../actions/getCurrentUser";
import getFavoriteIds from "../actions/getFavoriteIds";
import ClientOnly from "../components/ClientOnly";

interface HomeProps {
  searchParams: Promise<IListingsParams>
}

// Revalidate every 10 seconds for better caching
export const revalidate = 10;

const Home = async ({ searchParams }: HomeProps) => {
  const resolvedSearchParams = await searchParams;
  let userId: string | undefined = undefined;
  if (resolvedSearchParams && resolvedSearchParams.userId) {
    userId = resolvedSearchParams.userId;
  }
  
  // Fetch listings, user, and favorites in parallel for better performance
  // Handle errors gracefully to prevent page crash
  let listings: Awaited<ReturnType<typeof getListings>> = [];
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>> = null;
  let favoriteIds: Awaited<ReturnType<typeof getFavoriteIds>> = [];

  try {
    [listings, currentUser, favoriteIds] = await Promise.all([
      getListings({ ...resolvedSearchParams, userId }).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Home] Error fetching listings:', error instanceof Error ? error.message : String(error));
        }
        return [];
      }),
      getCurrentUser().catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Home] Error fetching current user:', error instanceof Error ? error.message : String(error));
        }
        return null;
      }),
      getFavoriteIds().catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Home] Error fetching favorites:', error instanceof Error ? error.message : String(error));
        }
        return [];
      })
    ]);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Home] Unexpected error:', error instanceof Error ? error.message : String(error));
    }
    // Ensure we have valid values even if Promise.all fails
    listings = listings || [];
    currentUser = currentUser || null;
    favoriteIds = favoriteIds || [];
  }

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
          gap-4
        ">
          {listings.map((listing) => {
            return (
              <ListingCard
                currentUser={currentUser}
                key={listing.id}
                data={listing}
                favoriteIds={favoriteIds}
              />
            )
          })}
        </div>
      </Container>
    </ClientOnly>
  )
}

export default Home;

