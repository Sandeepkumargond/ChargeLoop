"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChargingHistoryPage() {
  const [chargingSessions, setChargingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, completed, ongoing, cancelled
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
          // Check if it's an HTML response (server not running)
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("text/html")) {
            throw new Error(
              "Backend server is not running. Please start the backend server first."
            );
          }
          throw new Error("Failed to fetch charging history");
        }

        const historyData = await response.json();
        setChargingSessions(historyData.sessions || []);
      } catch (error) {
        console.error("Error fetching charging history:", error);
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

  const filteredSessions = chargingSessions.filter((session) => {
    if (filter === "all") return true;
    return session.status === filter;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.startTime) - new Date(a.startTime);
      case "oldest":
        return new Date(a.startTime) - new Date(b.startTime);
      case "duration":
        return b.duration - a.duration;
      case "cost":
        return b.cost - a.cost;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">
            Loading charging history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 dark:text-red-400 text-center mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Error Loading History</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
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
            <div className="pb-8 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">Charging History</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">View and manage all your charging sessions</p>
        </div>

        {/* Quick Stats - Inline */}
        <div className="py-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{chargingSessions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{chargingSessions.filter((s) => s.status === "completed").length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Energy Used</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{chargingSessions.reduce((sum, s) => sum + (s.energyConsumed || 0), 0).toFixed(1)} kWh</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">₹{chargingSessions.reduce((sum, s) => sum + (s.cost || 0), 0)}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="py-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="pending">Pending Requests</option>
                <option value="accepted">Accepted Requests</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">By Duration</option>
                <option value="cost">By Cost</option>
              </select>
            </div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{sortedSessions.length} of {chargingSessions.length} sessions</span>
        </div>

        {/* Sessions Table */}
        <div className="py-8">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Charging Sessions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't booked any charging sessions yet</p>
              <button
                onClick={() => router.push("/map")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
              >
                Find Chargers
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedSessions.map((session) => (
                <div
                  key={session._id || session.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Session Details */}
                    <div className="lg:col-span-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{session.hostName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{session.hostLocation}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{session.chargerType}</p>
                    </div>
                    
                    {/* Time & Duration */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{formatDuration(session.duration)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{formatDateTime(session.startTime)}</p>
                    </div>
                    
                    {/* Energy & Cost */}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Energy</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{session.energyConsumed || 0} kWh</p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-2">₹{session.cost || 0}</p>
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="flex flex-col items-start lg:items-end justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                      </span>
                      {session.status === "pending" && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Waiting for host approval</p>
                      )}
                      {session.status === "accepted" && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Request approved by host</p>
                      )}
                      <div className="flex gap-2 mt-3 w-full lg:justify-end">
                        <button className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition">
                          Details
                        </button>
                        {session.status === "completed" && (
                          <button className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {sortedSessions.length > 0 && (
          <div className="text-center py-8">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm font-medium">
              Load More Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
