"use client";

import { useEffect, useState } from "react";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import PhotoGallery from "@/components/ui/PhotoGallery";
import { SkeletonEventCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  deadline: string;
  price: number;
  isPaid: boolean;
  capacity?: number;
  mainPhoto?: string;
  photos?: string[];
  createdBy: { _id: string; name: string; email: string };
  participants: any[];
  createdAt: string;
}

export default function AdminEventsPage() {
  const { user, loading } = useAdminRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedEventForGallery, setSelectedEventForGallery] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    deadline: "",
    isPaid: false,
    price: 0,
    capacity: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const data = await eventsAPI.getMyEvents();
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.date || !formData.deadline) {
      setError("Title, date, and deadline are required");
      return;
    }

    // Validate deadline is before event date
    if (new Date(formData.deadline) >= new Date(formData.date)) {
      setError("Deadline must be before event date");
      return;
    }

    if (formData.isPaid && (!formData.price || formData.price <= 0)) {
      setError("Price must be greater than 0 for paid events");
      return;
    }
    if (!formData.capacity || formData.capacity <= 0) {
  setError("Capacity must be greater than 0");
  return;
}

    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      if (editingId) {
        // Update event
        const updated = await eventsAPI.update(editingId, formData);
        setEvents(events.map((e) => (e._id === editingId ? updated : e)));
        setSuccess("Event updated successfully!");
      } else {
        // Create new event
        const newEvent = await eventsAPI.create(
          formData.title,
          formData.description,
          formData.date,
          formData.deadline,
          formData.isPaid,
          formData.price,
          formData.capacity
        );
        setEvents([...events, newEvent]);
        setSuccess("Event created successfully!");
      }

      setFormData({
        title: "",
        description: "",
        date: "",
        deadline: "",
        isPaid: false,
        price: 0,
        capacity: 0,
      });
      setShowForm(false);
      setEditingId(null);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date.split("T")[0],
      deadline: event.deadline.split("T")[0],
      isPaid: event.isPaid,
      price: event.price,
      capacity: event.capacity || 0,
    });
    setEditingId(event._id);
    setShowForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      setError("");
      setSuccess("");
      await eventsAPI.delete(eventId);
      setEvents(events.filter((e) => e._id !== eventId));
      setSuccess("Event deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to delete event");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      date: "",
      deadline: "",
      isPaid: false,
      price: 0,
      capacity: 0,
    });
    setError("");
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl.trim()) {
      setError("Photo URL is required");
      return;
    }

    if (!selectedEventId) {
      setError("Event not found");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const updatedEvent = await eventsAPI.addPhoto(selectedEventId, photoUrl);
      setEvents(events.map((e) => (e._id === selectedEventId ? updatedEvent : e)));
      setPhotoUrl("");
      setShowPhotoForm(false);
      setSuccess("Photo added successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to add photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePhoto = async (eventId: string, photoToRemove: string) => {
    if (!confirm("Are you sure you want to remove this photo?")) return;

    try {
      setError("");
      setSuccess("");

      const updatedEvent = await eventsAPI.removePhoto(eventId, photoToRemove);
      setEvents(events.map((e) => (e._id === eventId ? updatedEvent : e)));
      setSuccess("Photo removed successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to remove photo");
    }
  };

  if (loading || eventsLoading) {
    return <SkeletonEventCard count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Manage Events</h2>
          <p className="text-zinc-300 mt-1">Create and manage your events</p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Create Event
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/30 border border-red-400/50 rounded-lg text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/30 border border-green-400/50 rounded-lg text-green-200 backdrop-blur-md">
          {success}
        </div>
      )}

      {showForm && (
        <Card>
          <h3 className="text-lg font-bold mb-4">
            {editingId ? "Edit Event" : "Create New Event"}
          </h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-200">
                Event Title *
              </label>
              <Input
                type="text"
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-200">
                Description
              </label>
              <textarea
                placeholder="Enter event description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition resize-none"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-200">
                  Event Date *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-200">
                  Registration Deadline *
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Members can register until this date
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) =>
                      setFormData({ ...formData, isPaid: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/10 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-zinc-200">
                    Paid Event
                  </span>
                </label>
              </div>

              {formData.isPaid && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-200">
                    Price (₹) *
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter event price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              <div>
  <label className="block text-sm font-medium mb-2 text-zinc-200">
    Capacity *
  </label>
  <Input
    type="number"
    placeholder="Enter maximum participants"
    value={formData.capacity}
    onChange={(e) =>
      setFormData({
        ...formData,
        capacity: parseInt(e.target.value) || 0,
      })
    }
    min="1"
    required
  />
</div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting
                  ? editingId
                    ? "Updating..."
                    : "Creating..."
                  : editingId
                  ? "Update Event"
                  : "Create Event"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showPhotoForm && selectedEventId && (
        <Card>
          <h3 className="text-lg font-bold mb-4">Add Photo to Event</h3>
          <form onSubmit={handleAddPhoto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-200">
                Photo URL *
              </label>
              <Input
                type="url"
                placeholder="Enter photo URL"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Adding..." : "Add Photo"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowPhotoForm(false);
                  setPhotoUrl("");
                  setSelectedEventId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {events.length === 0 ? (
        <EmptyState
          icon="📅"
          title={showForm ? "Create Your First Event" : "No Events Yet"}
          description={
            showForm
              ? "Fill in the form above to create your first event"
              : "Start by creating an event to manage registrations and engage members"
          }
          ctaText={!showForm ? "Create Event" : undefined}
          ctaAction={!showForm ? () => setShowForm(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const eventDate = new Date(event.date);
            const deadlineDate = new Date(event.deadline);
            const now = new Date();
            const deadlinePassed = now > deadlineDate;

            return (
              <Card key={event._id}>
                <div className="space-y-4">
                  {/* Main Photo Display */}
                  {event.mainPhoto && (
                    <div
                      className="relative w-full h-48 rounded-lg overflow-hidden bg-zinc-800 cursor-pointer group/photo"
                      onClick={() => {
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

                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{event.title}</h3>
                          {event.isPaid && (
                            <Badge variant="info">
                              💰 ₹{event.price.toFixed(2)}
                            </Badge>
                          )}
                          {deadlinePassed && (
                            <Badge variant="warning">Registration Closed</Badge>
                          )}
                        </div>
                        <p className="text-zinc-300 text-sm mb-3">
                          {event.description}
                        </p>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
  <p className="text-zinc-400">Capacity</p>
  <p className="text-white font-semibold">
    {event.participants.length} / {event.capacity || 0}
  </p>
</div>
                    <div>
                      <p className="text-zinc-400">Status</p>
                      <p className="text-white font-semibold">
                        {deadlinePassed ? "Closed" : "Open"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditEvent(event)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedEventId(event._id);
                        setShowPhotoForm(true);
                      }}
                      className="flex-1"
                    >
                      Add Photo
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteEvent(event._id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>

                  {/* Photos Section */}
                  {event.photos && event.photos.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-zinc-300">
                        Photos ({event.photos.length})
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {event.photos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={photo}
                              alt={`Event photo ${idx + 1}`}
                              className="w-full h-20 object-cover rounded border border-white/10"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23404040' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='8' fill='%23999' text-anchor='middle' dy='.3em'%3ENot found%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            <button
                              onClick={() =>
                                handleRemovePhoto(event._id, photo)
                              }
                              className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100 rounded"
                              title="Remove photo"
                            >
                              <span className="text-white font-bold">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-blue-500/30 backdrop-blur-md border border-blue-400/30 rounded-lg p-4 text-blue-200 text-sm">
        <p className="font-semibold mb-2">💡 How it works:</p>
        <ul className="space-y-1 text-xs">
          <li>
            • Set a registration deadline before the event date - members can
            register until then
          </li>
          <li>
            • Create paid events by enabling "Paid Event" and setting a price
          </li>
          <li>• Add photos to showcase your events to members</li>
          <li>• Members can view all event photos in the gallery</li>
          <li>• Registration closes automatically after the deadline</li>
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
