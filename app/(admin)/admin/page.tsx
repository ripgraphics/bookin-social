"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/app/components/admin/StatsCard";
import RevenueChart from "@/app/components/admin/RevenueChart";
import { Users, Home, Calendar, DollarSign, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import toast from "react-hot-toast";

interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalListings: number;
  totalReservations: number;
  activeReservations: number;
  totalRevenue: number;
  revenueThisYear: number;
  revenueLastYear: number;
  yearOverYearGrowth: number;
  revenueByMonth: { month: string; revenue: number }[];
  topListings: any[];
  recentReservations: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/admin/stats");
        setStats(response.data);
      } catch (error: any) {
        console.error("Failed to fetch stats:", error);
        toast.error("Failed to load dashboard stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Loading dashboard data...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={`+${stats.newUsersThisMonth} this month`}
          changeType="positive"
          icon={Users}
          iconColor="text-modernize-primary"
        />
        <StatsCard
          title="Total Listings"
          value={stats.totalListings.toLocaleString()}
          icon={Home}
          iconColor="text-modernize-secondary"
        />
        <StatsCard
          title="Total Reservations"
          value={stats.totalReservations.toLocaleString()}
          change={`${stats.activeReservations} active`}
          changeType="neutral"
          icon={Calendar}
          iconColor="text-modernize-success"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={`${stats.yearOverYearGrowth > 0 ? "+" : ""}${stats.yearOverYearGrowth}% YoY`}
          changeType={stats.yearOverYearGrowth > 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="text-modernize-warning"
        />
      </div>

      {/* Revenue Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={stats.revenueByMonth} />
        </div>

        {/* Yearly Breakup */}
        <Card>
          <CardHeader>
            <CardTitle>Yearly Breakup</CardTitle>
            <CardDescription>Revenue comparison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.revenueThisYear)}
              </div>
              <p className="text-sm text-gray-500 mt-1">This Year</p>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp
                className={`h-4 w-4 ${
                  stats.yearOverYearGrowth > 0 ? "text-modernize-success" : "text-modernize-danger"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  stats.yearOverYearGrowth > 0 ? "text-modernize-success" : "text-modernize-danger"
                }`}
              >
                {stats.yearOverYearGrowth > 0 ? "+" : ""}
                {stats.yearOverYearGrowth}%
              </span>
              <span className="text-sm text-gray-500">from last year</span>
            </div>
            <div className="pt-4 border-t">
              <div className="text-lg font-semibold text-gray-700">
                {formatCurrency(stats.revenueLastYear)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Last Year</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reservations</CardTitle>
          <CardDescription>Latest bookings on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentReservations.map((reservation: any) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reservation.user?.image} />
                        <AvatarFallback>
                          {reservation.user?.first_name?.[0]}
                          {reservation.user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {reservation.user?.first_name} {reservation.user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{reservation.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{reservation.listing?.title}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{format(new Date(reservation.start_date), "MMM dd, yyyy")}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{format(new Date(reservation.end_date), "MMM dd, yyyy")}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{formatCurrency(reservation.total_price)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        new Date(reservation.end_date) > new Date() ? "default" : "secondary"
                      }
                    >
                      {new Date(reservation.end_date) > new Date() ? "Active" : "Completed"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
          <CardDescription>Listings with highest revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topListings.map((listing: any) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden">
                        {listing.image_src && (
                          <img
                            src={
                              typeof listing.image_src === "string" &&
                              listing.image_src.startsWith("[")
                                ? JSON.parse(listing.image_src)[0]
                                : listing.image_src
                            }
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <p className="text-sm font-medium">{listing.title}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(listing.revenue)}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

