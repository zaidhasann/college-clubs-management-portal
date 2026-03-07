"use client";

import { useState, useEffect } from "react";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI, attendanceAPI } from "@/lib/api";
import { Event } from "@/types/index";

export default function AttendanceReportsPage() {
  const { loading } = useAdminRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!loading) {
      fetchEvents();
    }
  }, [loading]);

  const fetchEvents = async () => {
    try {
      const data = await eventsAPI.getAll();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const loadEventStats = async (eventId: string) => {
    try {
      setLoadingStats(true);
      const data = await attendanceAPI.getStats(eventId);
      setStats(data);
      
      const event = events.find((e) => e._id === eventId);
      setSelectedEvent(event || null);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    // Create CSV content
    let csv = "Name,Email,Roll Number,Status\n";
    
    // Add attended users
    stats.attendedUsers.forEach((user: any) => {
      csv += `${user.name},${user.email},${user.rollNumber || "N/A"},Attended\n`;
    });
    
    // Add registered but not attended
    stats.registeredButNotAttended.forEach((user: any) => {
      csv += `${user.name},${user.email},${user.rollNumber || "N/A"},Absent\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedEvent?.title.replace(/\s+/g, "_")}_attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Reports</h1>
        <p className="text-zinc-400 mt-1">
          View detailed attendance statistics for events
        </p>
      </div>

      {/* Event List */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Select Event</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event._id}
              onClick={() => loadEventStats(event._id)}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                selectedEvent?._id === event._id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
              }`}
            >
              <h3 className="font-semibold">{event.title}</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {new Date(event.date).toLocaleDateString()}
              </p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-blue-400">
                  Registered: {event.registrationsCount}
                </span>
                <span className="text-green-400">
                  Attended: {event.attendanceCount || 0}
                </span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    event.status === "upcoming"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <p className="text-center text-zinc-400 py-8">
            No events found. Create an event to start tracking attendance.
          </p>
        )}
      </div>

      {/* Stats Display */}
      {loadingStats && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 text-center">
          <div className="text-zinc-400">Loading statistics...</div>
        </div>
      )}

      {stats && !loadingStats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-sm">Total Registered</div>
              <div className="text-3xl font-bold mt-2">
                {stats.stats.totalRegistered}
              </div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-sm">Total Attended</div>
              <div className="text-3xl font-bold mt-2 text-green-400">
                {stats.stats.totalAttended}
              </div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-sm">Not Attended</div>
              <div className="text-3xl font-bold mt-2 text-red-400">
                {stats.stats.notAttended}
              </div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-zinc-400 text-sm">Attendance Rate</div>
              <div className="text-3xl font-bold mt-2 text-blue-400">
                {stats.stats.attendancePercentage}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              📥 Export to CSV
            </button>
          </div>

          {/* Attended Users */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              Attended ({stats.stats.totalAttended})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.attendedUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                    {user.rollNumber && (
                      <p className="text-xs text-zinc-500">
                        Roll: {user.rollNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-green-400">✓</div>
                </div>
              ))}
              {stats.attendedUsers.length === 0 && (
                <p className="text-center text-zinc-500 py-4">
                  No one has checked in yet
                </p>
              )}
            </div>
          </div>

          {/* Absent Users */}
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-red-400">
              Absent ({stats.stats.notAttended})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.registeredButNotAttended.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                    {user.rollNumber && (
                      <p className="text-xs text-zinc-500">
                        Roll: {user.rollNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-red-400">✗</div>
                </div>
              ))}
              {stats.registeredButNotAttended.length === 0 && (
                <p className="text-center text-zinc-500 py-4">
                  Everyone attended!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
