"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import EventCard from "@/components/dashboard/EventCard";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI } from "@/lib/api";
import { Event } from "@/types/index";

export default function MemberDashboard() {
  const { user, loading } = useProtectedRoute();
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

  const upcomingEvents = events.filter((e) => e.status === "upcoming").length;
  const completedEvents = events.filter((e) => e.status === "completed").length;

  return (
    <div className="space-y-10">
      {/* ================= Stats Section ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Welcome"
          value={user?.name || "Member"}
          subtitle="Your dashboard"
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.toString()}
          subtitle="Events to join"
        />
        <StatCard
          title="Completed Events"
          value={completedEvents.toString()}
          subtitle="Attended events"
        />
        <StatCard
          title="Total Events"
          value={events.length.toString()}
          subtitle="All events"
        />
      </div>

      {/* ================= Upcoming Events Section ================= */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Upcoming Events</h3>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-2xl p-6 text-red-400 mb-6">
            {error}
          </div>
        )}

        {eventsLoading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
            Loading events...
          </div>
        ) : events.filter((e) => e.status === "upcoming").length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
            No upcoming events available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter((e) => e.status === "upcoming")
              .map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
          </div>
        )}
      </div>

      {/* ================= Completed Events Section ================= */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Completed Events</h3>

        {events.filter((e) => e.status === "completed").length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
            No completed events yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter((e) => e.status === "completed")
              .map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
