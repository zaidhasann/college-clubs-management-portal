"use client";

import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { useMemberRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Registration {
  _id: string;
  qrCode?: string;
  event: {
    _id: string;
    title: string;
    description: string;
    date: string;
    deadline: string;
    price: number;
    isPaid: boolean;
    createdBy?: { name: string; email: string } | null;
  } | null;
  status: "registered" | "attended" | "cancelled";
  isCheckedIn: boolean;
  checkedInAt?: string;
  registeredAt: string;
}

export default function MyRegistrationsPage() {
  const { loading } = useMemberRoute();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setRegistrationsLoading(true);
        const data = await eventsAPI.getUserRegistrations();
        setRegistrations(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load registrations");
      } finally {
        setRegistrationsLoading(false);
      }
    };

    if (!loading) {
      fetchRegistrations();
    }
  }, [loading]);

  const handleCancelRegistration = async (registrationId: string) => {
    if (!window.confirm("Are you sure you want to cancel this registration?")) {
      return;
    }

    try {
      setCancelingId(registrationId);
      setRegistrations((prev) =>
        prev.filter((r) => r._id !== registrationId)
      );
    } catch (err) {
      setError((err as Error).message || "Failed to cancel registration");
    } finally {
      setCancelingId(null);
    }
  };

  if (loading || registrationsLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  // ✅ Remove registrations where event is null
  const validRegistrations = registrations.filter((reg) => reg.event);

  const upcomingEvents = validRegistrations.filter(
    (reg) => new Date(reg.event!.date) > new Date()
  );

  const pastEvents = validRegistrations.filter(
    (reg) => new Date(reg.event!.date) <= new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Registrations</h2>
        <p className="text-sm text-zinc-300 mt-1">
          View all events you've registered for
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/30 border border-red-400/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {validRegistrations.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-zinc-300 mb-4">
            You haven't registered for any events yet
          </p>
          <a href="/dashboard/member/events">
            <Button variant="primary">Browse Events</Button>
          </a>
        </Card>
      ) : (
        <>
          {/* ================= UPCOMING ================= */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                📅 Upcoming Events
              </h3>

              {upcomingEvents.map((registration) => {
                const event = registration.event!;
                const eventDate = new Date(event.date);

                return (
                  <Card key={registration._id} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">
                          {event.title}
                        </h3>

                        {event.isPaid && (
                          <Badge variant="info">
                            💰 ₹{event.price.toFixed(2)}
                          </Badge>
                        )}

                        <p className="text-zinc-300 text-sm mt-2">
                          {event.description}
                        </p>
                      </div>

                      {registration.status === "attended" || registration.isCheckedIn ? (
                        <Badge variant="success">✓ Attended</Badge>
                      ) : (
                        <Badge variant="info">📋 Registered</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-400">Event Date</p>
                        <p className="font-semibold">
                          {eventDate.toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Registered On</p>
                        <p className="font-semibold">
                          {new Date(
                            registration.registeredAt
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Organized by</p>
                        <p className="font-semibold">
                          {event.createdBy?.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    {/* ✅ QR Section */}
                    <div className="flex flex-col items-center bg-white p-4 rounded-lg">
                      <p className="text-sm font-semibold mb-2 text-black">
                        🎟️ Show this QR at entry
                      </p>
                      <QRCode
                        value={
                          registration.qrCode || registration._id
                        }
                        size={160}
                      />
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        handleCancelRegistration(registration._id)
                      }
                      disabled={cancelingId === registration._id}
                      className="w-full"
                    >
                      {cancelingId === registration._id
                        ? "Canceling..."
                        : "Cancel Registration"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ================= PAST ================= */}
          {pastEvents.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-bold">
                ⏰ Past Events
              </h3>

              {pastEvents.map((registration) => {
                const event = registration.event!;
                const eventDate = new Date(event.date);

                return (
                  <Card key={registration._id} className="opacity-80 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold">
                        {event.title}
                      </h3>
                      <Badge variant="warning">Past Event</Badge>
                      <p className="text-zinc-300 text-sm mt-2">
                        {event.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-400">Event Date</p>
                        <p className="font-semibold">
                          {eventDate.toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Attendance</p>
                        <p className={`font-semibold ${
                          registration.status === "attended" || registration.isCheckedIn
                            ? "text-green-400"
                            : "text-red-400"
                        }`}>
                          {registration.status === "attended" || registration.isCheckedIn
                            ? "✓ Attended"
                            : "✗ Absent"}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Organized by</p>
                        <p className="font-semibold">
                          {event.createdBy?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}