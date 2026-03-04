"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import EventCard from "@/components/dashboard/EventCard";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI } from "@/lib/api";
import { Event } from "@/types/index";

export default function AdminDashboard() {
  const { user, loading } = useAdminRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const data = await eventsAPI.getAll();
        setEvents(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load events");
      } finally {
        setEventsLoading(false);
      }
    };

    if (!loading) {
      fetchEvents();
    }
  }, [loading]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const totalMembers = 320; // TODO: Fetch from API
  const totalEvents = events.length;
  const activeEvents = events.filter(
    (event) => event.status === "upcoming"
  ).length;
  const totalRegistrations = events.reduce(
    (acc, event) => acc + event.registrationsCount,
    0
  );

  return (
    <div className="space-y-10">
      {/* ================= Stats Section ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Members"
          value={totalMembers.toString()}
          subtitle="Active students"
        />
        <StatCard
          title="Total Events"
          value={totalEvents.toString()}
          subtitle="All events"
        />
        <StatCard
          title="Active Events"
          value={activeEvents.toString()}
          subtitle="Currently running"
        />
        <StatCard
          title="Total Registrations"
          value={totalRegistrations.toString()}
          subtitle="Across all events"
        />
      </div>

      {/* ================= Recent Events Section ================= */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Recent Events</h3>

          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
            + Create Event
          </button>

           <Link href="/dashboard/admin/scan">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
        Scan QR
      </button>
    </Link>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-2xl p-6 text-red-400 mb-6">
            {error}
          </div>
        )}

        {eventsLoading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
            No events available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}