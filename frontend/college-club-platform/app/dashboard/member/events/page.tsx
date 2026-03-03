"use client";

import { useEffect, useState } from "react";
import { useMemberRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PhotoGallery from "@/components/ui/PhotoGallery";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  deadline: string;
  price: number;
  isPaid: boolean;
  mainPhoto?: string;
  photos?: string[];
  createdBy: { _id: string; name: string; email: string };
  participants: any[];
  createdAt: string;
}

export default function MemberEventsPage() {
  const { user, loading } = useMemberRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedEventForGallery, setSelectedEventForGallery] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const data = await eventsAPI.getAll();
        setEvents(data);

       const registrations = await eventsAPI.getUserRegistrations();

const registeredIds = registrations
  .filter((reg: any) => reg.event && reg.event._id)
  .map((reg: any) => reg.event._id);

setRegisteredEvents(registeredIds);
        setRegisteredEvents(registeredIds);
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

  const handleRegisterEvent = async (eventId: string) => {
    try {
      setError("");
      setSuccess("");
      setRegistering(eventId);

      await eventsAPI.register(eventId);
      setRegisteredEvents([...registeredEvents, eventId]);
      setSuccess("Successfully registered for event!");

      // Refresh events
      const data = await eventsAPI.getAll();
      setEvents(data);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to register");
    } finally {
      setRegistering(null);
    }
  };

  if (loading || eventsLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Events</h2>
        <p className="text-xs sm:text-sm text-zinc-300 mt-1">Browse and register for upcoming events</p>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-500/30 border border-red-400/50 rounded-lg text-red-200 backdrop-blur-md text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 sm:p-4 bg-green-500/30 border border-green-400/50 rounded-lg text-green-200 backdrop-blur-md text-sm sm:text-base">
          {success}
        </div>
      )}

      {events.length === 0 ? (
        <Card className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-5xl mb-4">📅</div>
          <p className="text-sm sm:text-base text-zinc-300">No events available yet</p>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const deadlineDate = new Date(event.deadline);
            const now = new Date();
            const deadlinePassed = now > deadlineDate;
            const isRegistered = registeredEvents.includes(event._id);

            return (
              <div
                key={event?._id}
                className="group hover:bg-blue-400/60 cursor-pointer transition-all duration-300 ease-out"
                onClick={() => setSelectedEvent(event)}
              >
                <Card
                  className="group-hover:bg-white/20 group-hover:border-blue-400/60 transition-all duration-300 ease-out backdrop-blur-xl border-white/30 shadow-xl hover:shadow-2xl"
                >
                  <div className="space-y-3 sm:space-y-4">
                    {/* Main Photo Display */}
                    {event.mainPhoto && (
                      <div
                        className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-zinc-800 mb-3 cursor-pointer group/photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForGallery(event);
                          setGalleryOpen(true);
                        }}
                      >
                        <img
                          src={event.mainPhoto}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23404040' width='100' height='100'/%3E%3C/svg%3E";
                          }}
                        />
                        {(event.photos && event.photos.length > 0) && (
                          <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/40 transition flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover/photo:opacity-100 transition text-sm">
                              View all ({event.photos.length})
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold">{event.title}</h3>
                          {event.isPaid && (
                            <Badge variant="info">💰 ₹{event.price.toFixed(2)}</Badge>
                          )}
                          {deadlinePassed && (
                            <Badge variant="warning">Registration Closed</Badge>
                          )}
                          {isRegistered && (
                            <Badge variant="success">✓ Registered</Badge>
                          )}
                        </div>
                        <p className="text-zinc-300 text-xs sm:text-sm mb-3">
                          {event.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-zinc-400">Event Date</p>
                        <p className="text-white font-semibold">
                          {eventDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Deadline</p>
                        <p className="text-white font-semibold">
                          {deadlineDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Registrations</p>
                        <p className="text-white font-semibold">
                          {event.participants.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Organized by</p>
                        <p className="text-white font-semibold">
                          {event.createdBy.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    {!isRegistered && !deadlinePassed && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegisterEvent(event._id);
                        }}
                        disabled={registering === event._id}
                        className="w-full text-xs sm:text-sm"
                      >
                        {registering === event._id
                          ? "Registering..."
                          : event.isPaid
                          ? `Register - ₹${event.price.toFixed(2)}`
                          : "Register for Free"}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedEvent(null)}
        >
          <Card className="max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-2xl shadow-2xl border-white/40">
            <div onClick={(e) => e.stopPropagation()} className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{selectedEvent.title}</h2>
                    {selectedEvent.isPaid && (
                      <Badge variant="info">
                        💰 ₹{selectedEvent.price.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300">by {selectedEvent.createdBy.name}</p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-xl sm:text-2xl text-zinc-400 hover:text-white flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div>
                <h3 className="font-bold text-base sm:text-lg mb-2">Description</h3>
                <p className="text-sm sm:text-base text-zinc-300">{selectedEvent.description}</p>
              </div>

              {/* Photos Section */}
              {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-3">Photos ({selectedEvent.photos.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {selectedEvent.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative group overflow-hidden rounded-lg border border-white/20 aspect-square bg-white/5"
                      >
                        <img
                          src={photo}
                          alt={`Event photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23404040' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='8' fill='%23999' text-anchor='middle' dy='.3em'%3ENot found%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        {selectedEvent.mainPhoto === photo && (
                          <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-xl p-3 sm:p-4 shadow-lg hover:bg-white/20 transition-all duration-300">
                  <p className="text-zinc-400 text-xs sm:text-sm font-medium">Event Date</p>
                  <p className="text-white font-bold mt-1 text-sm sm:text-base">
                    {new Date(selectedEvent.date).toLocaleDateString()}
                  </p>
                  <p className="text-zinc-400 text-xs">
                    {new Date(selectedEvent.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-xl p-3 sm:p-4 shadow-lg hover:bg-white/20 transition-all duration-300">
                  <p className="text-zinc-400 text-xs sm:text-sm font-medium">Registration Deadline</p>
                  <p className="text-white font-bold mt-1 text-sm sm:text-base">
                    {new Date(selectedEvent.deadline).toLocaleDateString()}
                  </p>
                  {new Date() > new Date(selectedEvent.deadline) ? (
                    <p className="text-red-400 text-xs mt-1">Closed</p>
                  ) : (
                    <p className="text-green-400 text-xs mt-1">Open</p>
                  )}
                </div>

                <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-xl p-3 sm:p-4 shadow-lg hover:bg-white/20 transition-all duration-300">
                  <p className="text-zinc-400 text-xs sm:text-sm font-medium">Registrations</p>
                  <p className="text-white font-bold mt-1 text-sm sm:text-base">
                    {selectedEvent.participants.length}
                  </p>
                </div>
              </div>

              {selectedEvent.isPaid && (
                <div className="bg-blue-500/40 backdrop-blur-xl border border-blue-400/40 rounded-xl p-3 sm:p-4 shadow-lg hover:bg-blue-500/50 transition-all duration-300">
                  <p className="text-blue-100 text-xs sm:text-sm">
                    <span className="font-bold">Paid Event:</span> This is a paid
                    event. You'll need to complete the payment during
                    registration.
                  </p>
                </div>
              )}

              {registeredEvents.includes(selectedEvent._id) ? (
                <div className="bg-green-500/40 backdrop-blur-xl border border-green-400/40 rounded-xl p-3 sm:p-4 text-center shadow-lg hover:bg-green-500/50 transition-all duration-300">
                  <p className="text-green-100 font-semibold text-sm sm:text-base">
                    ✓ You are registered for this event
                  </p>
                </div>
              ) : new Date() > new Date(selectedEvent.deadline) ? (
                <div className="bg-red-500/40 backdrop-blur-xl border border-red-400/40 rounded-xl p-3 sm:p-4 text-center shadow-lg hover:bg-red-500/50 transition-all duration-300">
                  <p className="text-red-100 font-semibold text-sm sm:text-base">
                    Registration deadline has passed
                  </p>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full transition-all duration-300 ease-out shadow-lg hover:shadow-xl"
                  onClick={() => {
                    handleRegisterEvent(selectedEvent._id);
                    setSelectedEvent(null);
                  }}
                  disabled={registering === selectedEvent._id}
                >
                  {registering === selectedEvent._id
                    ? "Registering..."
                    : selectedEvent.isPaid
                    ? `Pay ₹${selectedEvent.price.toFixed(2)} & Register`
                    : "Register for Free"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="bg-blue-500/40 backdrop-blur-xl border border-blue-400/40 rounded-xl p-3 sm:p-4 text-blue-100 text-xs sm:text-sm shadow-lg">
        <p className="font-semibold mb-2 text-sm sm:text-base">💡 How it works:</p>
        <ul className="space-y-1 text-xs">
          <li>• Browse all available events and view details</li>
          <li>• Click on an event to view more details and photos</li>
          <li>• Check the registration deadline before registering</li>
          <li>• Some events may require payment - complete it during registration</li>
        </ul>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGallery
        isOpen={galleryOpen}
        onClose={() => {
          setGalleryOpen(false);
          setSelectedEventForGallery(null);
        }}
        photos={selectedEventForGallery?.photos || []}
        mainPhoto={selectedEventForGallery?.mainPhoto}
        title={selectedEventForGallery?.title || "Event Photos"}
      />
    </div>
  );
}
