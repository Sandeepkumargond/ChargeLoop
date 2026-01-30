"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChargingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, completed, ongoing, cancelled, accepted, pending
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, duration, cost
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/charging/history`,
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
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
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
        return (b.actualDuration || b.estimatedDuration || 0) - (a.actualDuration || a.estimatedDuration || 0);
      case "cost":
        return (b.actualCost || b.estimatedCost || 0) - (a.actualCost || a.estimatedCost || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded border border-gray-200 dark:border-gray-700">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Error Loading History</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header Section */}
            <div className="pb-6 border-b border-gray-200 dark:border-gray-700 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Charging History</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">View all your charging sessions</p>
        </div>

        {/* Quick Stats - Inline */}
        <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Bookings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{bookings.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Completed</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{bookings.filter((s) => s.status === "completed").length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Energy Used</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{bookings.reduce((sum, s) => sum + (s.energyConsumed || 0), 0).toFixed(1)} kWh</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Spent</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">₹{bookings.reduce((sum, s) => sum + (s.actualCost || s.estimatedCost || 0), 0)}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="duration">Duration</option>
                <option value="cost">Cost</option>
              </select>
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">{sortedSessions.length} of {bookings.length}</span>
        </div>

        {/* Sessions Table */}
        <div>
          {sortedSessions.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No Charging Sessions</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">No bookings yet</p>
              <button
                onClick={() => router.push("/map")}
                className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition text-sm font-medium"
              >
                Find Chargers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((booking) => (
                <div
                  key={booking._id || booking.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Booking Details */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Station</p>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{booking.hostName}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{booking.hostLocation}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{booking.chargerType}</p>
                    </div>
                    
                    {/* Time & Duration */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDuration(booking.actualDuration || booking.estimatedDuration)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatDateTime(booking.scheduledTime)}</p>
                    </div>
                    
                    {/* Energy & Cost */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Energy • Cost</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.energyConsumed || 0} kWh • ₹{booking.actualCost || booking.estimatedCost || 0}</p>
                    </div>
                    
                    {/* Status */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Status</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium inline-block ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center justify-start lg:justify-end">
                      <button className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        Details
                      </button>
                      {booking.status === "completed" && (
                        <button className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                          Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {sortedSessions.length > 0 && (
          <div className="text-center py-4">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-xs font-medium">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
