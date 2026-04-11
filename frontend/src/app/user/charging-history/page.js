"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChargingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const router = useRouter();

  useEffect(() => {
    const fetchChargingHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/bookings/history`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("text/html")) {
            throw new Error(
              "Backend server is not running. Please start the backend server first."
            );
          }
          throw new Error("Failed to fetch booking history");
        }

        const historyData = await response.json();
        setBookings(historyData.sessions || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChargingHistory();
  }, [router]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300";
      case "ongoing":
      case "active":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300";
      case "accepted":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300";
      case "cancelled":
      case "declined":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300";
      default:
        return "bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "ongoing":
      case "active":
        return "Charging";
      case "pending":
        return "Pending Approval";
      case "accepted":
        return "Accepted";
      case "cancelled":
        return "Cancelled";
      case "declined":
        return "Declined";
      default:
        return "Unknown";
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === 0) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStarRating = (rating) => {
    if (!rating) return "Not rated";
    return `${rating}/5 stars`;
  };

  const filteredSessions = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "duration":
        return (b.actualDuration || b.requestedDuration || 0) - (a.actualDuration || a.requestedDuration || 0);
      case "kwh":
        return (b.totalUnitsKwh || b.desiredKwh || 0) - (a.totalUnitsKwh || a.desiredKwh || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 p-6 rounded border border-neutral-200 dark:border-neutral-700">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-600 dark:text-neutral-300 mt-3 text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-800 p-6 rounded border border-neutral-200 dark:border-neutral-700 max-w-md w-full mx-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Error Loading History</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="pb-6 mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Charging History</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">View all your charging sessions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-2">Total Bookings</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{bookings.length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-2">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{bookings.filter((s) => s.status === "completed").length}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-2">Energy Used</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{bookings.reduce((sum, s) => sum + (s.energyConsumed || 0), 0).toFixed(1)} <span className="text-sm">kWh</span></p>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-2">Total Cost</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{bookings.reduce((sum, s) => sum + (s.totalBill || s.actualCost || 0), 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div className="flex-1 sm:flex-none">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="duration">Duration</option>
                  <option value="kwh">kWh Requested</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              {sortedSessions.length} of {bookings.length} results
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div>
          {sortedSessions.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center shadow-sm">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-700 mx-auto flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Charging Sessions</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">You haven't started any charging sessions yet. Find and book a charger to get started.</p>
              <button
                onClick={() => router.push("/user/chargers")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition"
              >
                Find Chargers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((booking) => (
                <div
                  key={booking._id || booking.id}
                  className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 hover:shadow-md transition shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Host Name */}
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-1">Host Name</p>
                      <h3 className="font-medium text-neutral-900 dark:text-white text-sm">{booking.hostName}</h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{booking.hostPhone || 'N/A'}</p>
                    </div>

                    {/* Location */}
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-1">Location</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2">{booking.hostLocation}</p>
                    </div>

                    {/* Energy */}
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-1">Energy</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{booking.energyConsumed || booking.totalUnitsKwh || 0} kWh</p>
                    </div>

                    {/* Price */}
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-1">Price</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">₹{booking.totalBill || booking.actualCost || 0}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mb-1">Status</p>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium inline-block ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                      </span>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">{formatDateTime(booking.scheduledTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
