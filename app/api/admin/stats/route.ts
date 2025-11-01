import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { canAccessAdminDashboard } from "@/app/utils/permissions";

export async function GET(request: Request) {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUser();
    if (!currentUser || !canAccessAdminDashboard(currentUser)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await createAdminClient();

    // Get current date and date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const firstDayOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const lastDayOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    // Parallel queries for better performance
    const [
      usersResult,
      usersThisMonthResult,
      listingsResult,
      reservationsResult,
      activeReservationsResult,
      revenueResult,
      revenueThisYearResult,
      revenueLastYearResult,
      revenueByMonthResult,
      topListingsResult,
      recentReservationsResult,
    ] = await Promise.all([
      // Total users
      supabase.from("users").select("id", { count: "exact", head: true }),

      // New users this month
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth.toISOString()),

      // Total listings
      supabase.from("listings").select("id", { count: "exact", head: true }),

      // Total reservations
      supabase.from("reservations").select("id", { count: "exact", head: true }),

      // Active reservations (end date in the future)
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .gte("end_date", now.toISOString()),

      // Total revenue
      supabase.from("reservations").select("total_price"),

      // Revenue this year
      supabase
        .from("reservations")
        .select("total_price")
        .gte("created_at", firstDayOfYear.toISOString()),

      // Revenue last year
      supabase
        .from("reservations")
        .select("total_price")
        .gte("created_at", firstDayOfLastYear.toISOString())
        .lte("created_at", lastDayOfLastYear.toISOString()),

      // Revenue by month (last 12 months)
      supabase
        .from("reservations")
        .select("total_price, created_at")
        .gte("created_at", new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString())
        .order("created_at", { ascending: true }),

      // Top 5 listings by revenue
      supabase
        .from("reservations")
        .select(
          `
          listing_id,
          total_price,
          listing:listings(id, title, image_src)
        `
        )
        .limit(100),

      // Recent 10 reservations
      supabase
        .from("reservations")
        .select(
          `
          id,
          start_date,
          end_date,
          total_price,
          created_at,
          user:users(id, first_name, last_name, email, image),
          listing:listings(id, title, image_src)
        `
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Calculate total revenue
    const totalRevenue =
      revenueResult.data?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

    // Calculate revenue this year
    const revenueThisYear =
      revenueThisYearResult.data?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

    // Calculate revenue last year
    const revenueLastYear =
      revenueLastYearResult.data?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

    // Calculate year-over-year growth
    const yearOverYearGrowth =
      revenueLastYear > 0
        ? ((revenueThisYear - revenueLastYear) / revenueLastYear) * 100
        : 0;

    // Group revenue by month
    const revenueByMonth: { [key: string]: number } = {};
    revenueByMonthResult.data?.forEach((r) => {
      const month = new Date(r.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (r.total_price || 0);
    });

    // Calculate top listings by revenue
    const listingRevenue: { [key: string]: { total: number; listing: any } } = {};
    topListingsResult.data?.forEach((r: any) => {
      if (r.listing_id && r.listing) {
        if (!listingRevenue[r.listing_id]) {
          listingRevenue[r.listing_id] = { total: 0, listing: r.listing };
        }
        listingRevenue[r.listing_id].total += r.total_price || 0;
      }
    });

    const topListings = Object.values(listingRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((item) => ({
        ...item.listing,
        revenue: item.total,
      }));

    // Return stats
    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      newUsersThisMonth: usersThisMonthResult.count || 0,
      totalListings: listingsResult.count || 0,
      totalReservations: reservationsResult.count || 0,
      activeReservations: activeReservationsResult.count || 0,
      totalRevenue,
      revenueThisYear,
      revenueLastYear,
      yearOverYearGrowth: Math.round(yearOverYearGrowth * 10) / 10,
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue,
      })),
      topListings,
      recentReservations: recentReservationsResult.data || [],
    });
  } catch (error: any) {
    console.error("[GET /api/admin/stats] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

