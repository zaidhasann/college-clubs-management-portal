"use client";

import { useEffect, useState } from "react";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { clubsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface Club {
  _id: string;
  name: string;
  description: string;
  admin: { _id: string; name: string; email: string };
  members: any[];
  mainPhoto?: string;
  photos: string[];
  createdAt: string;
}

interface JoinRequest {
  _id: string;
  userId: { _id: string; name: string; email: string };
  clubId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export default function AdminClubsPage() {
  const { user, loading } = useAdminRoute();
  const [myClub, setMyClub] = useState<Club | null>(null);
  const [clubLoading, setClubLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    const fetchMyClub = async () => {
      try {
        setClubLoading(true);
        const club = await clubsAPI.getMyClub();
        setMyClub(club);
        setShowForm(false);
      } catch (err: any) {
        if (err.message !== "You don't have a club yet") {
          setError((err as Error).message || "Failed to load club");
        }
        setMyClub(null);
      } finally {
        setClubLoading(false);
      }
    };

    if (!loading) {
      fetchMyClub();
    }
  }, [loading]);

  // Fetch join requests when club is loaded
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!myClub) return;

      try {
        setLoadingRequests(true);
        const response = await fetch(
          `/api/clubs/${myClub._id}/join-requests/pending`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setJoinRequests(data);
        }
      } catch (err) {
        console.error("Failed to fetch join requests:", err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchJoinRequests();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchJoinRequests, 10000);
    return () => clearInterval(interval);
  }, [myClub]);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Club name is required");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const newClub = await clubsAPI.create(formData.name, formData.description);

      setMyClub(newClub);
      setFormData({ name: "", description: "" });
      setShowForm(false);
      setSuccess("Club created successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to create club");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!myClub || !confirm("Are you sure you want to delete this club?"))
      return;

    try {
      setError("");
      setSuccess("");
      await clubsAPI.delete(myClub._id);

      setMyClub(null);
      setSuccess("Club deleted successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to delete club");
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl.trim()) {
      setError("Photo URL is required");
      return;
    }

    if (!myClub) {
      setError("Club not found");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const updatedClub = await clubsAPI.addPhoto(myClub._id, photoUrl);
      setMyClub(updatedClub);
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

  const handleRemovePhoto = async (photoToRemove: string) => {
    if (!myClub || !confirm("Are you sure you want to remove this photo?"))
      return;

    try {
      setError("");
      setSuccess("");

      const updatedClub = await clubsAPI.removePhoto(
        myClub._id,
        photoToRemove
      );
      setMyClub(updatedClub);
      setSuccess("Photo removed successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to remove photo");
    }
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    if (!myClub) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/clubs/${myClub._id}/join-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setJoinRequests(joinRequests.filter((r) => r._id !== requestId));
        setSuccess("Join request approved!");
        setTimeout(() => setSuccess(""), 3000);

        // Refresh club data to update members count
        const club = await clubsAPI.getMyClub();
        setMyClub(club);
      } else {
        setError("Failed to approve request");
      }
    } catch (err) {
      setError("Failed to approve request");
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    if (!myClub) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/clubs/${myClub._id}/join-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setJoinRequests(joinRequests.filter((r) => r._id !== requestId));
        setSuccess("Join request rejected!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to reject request");
      }
    } catch (err) {
      setError("Failed to reject request");
    }
  };

  if (loading || clubLoading) {
    return <SkeletonCard className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Club Management</h2>
        <p className="text-zinc-400 mt-1">
          {myClub
            ? "Manage your club and add photos"
            : "Create a club for your members"}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {!myClub ? (
        <>
          {!showForm ? (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Create My Club
            </Button>
          ) : (
            <Card>
              <h3 className="text-lg font-bold mb-4">Create Your Club</h3>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Club Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter club name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter club description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Club"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ name: "", description: "" });
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card className="text-center py-12">
            <div className="text-4xl mb-4">🏛️</div>
            <p className="text-zinc-400">
              Create a club to start managing members and events
            </p>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">{myClub.name}</h3>
                <p className="text-zinc-400 mt-2">{myClub.description}</p>
                <p className="text-sm text-zinc-500 mt-4">
                  Members: {myClub.members.length}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteClub}
              >
                Delete Club
              </Button>
            </div>
          </Card>

          {/* Join Requests Section */}
          {joinRequests.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4">
                Pending Join Requests ({joinRequests.length})
              </h3>
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <Card key={request._id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{request.userId.name}</p>
                      <p className="text-sm text-zinc-400">{request.userId.email}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Requested {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApproveJoinRequest(request._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRejectJoinRequest(request._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Photos Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Club Photos</h3>
              {!showPhotoForm && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowPhotoForm(true)}
                >
                  Add Photo
                </Button>
              )}
            </div>

            {showPhotoForm && (
              <Card className="mb-4">
                <form onSubmit={handleAddPhoto} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-300">
                      Photo URL *
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      required
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Paste the URL of an image from your device or cloud
                      storage
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adding..." : "Add Photo"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowPhotoForm(false);
                        setPhotoUrl("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {myClub.photos && myClub.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myClub.photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg bg-zinc-800">
                      <img
                        src={photo}
                        alt={`Club photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23404040' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='12' fill='%23999' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(photo)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg"
                    >
                      <span className="text-red-400 text-sm font-semibold">
                        Remove
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <div className="text-4xl mb-4">📸</div>
                <p className="text-zinc-400">
                  No photos yet. Add some to showcase your club!
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-400 text-sm">
        <p className="font-semibold mb-2">💡 How it works:</p>
        <ul className="space-y-1 text-xs">
          <li>• Each admin can create and manage only ONE club</li>
          <li>• Members request to join your club (requires your approval)</li>
          <li>• Review and approve/reject pending join requests</li>
          <li>• Add photos to showcase your club to members</li>
          <li>• Members can view all your club's photos once approved</li>
          <li>• Only you can add or remove photos from your club</li>
        </ul>
      </div>
    </div>
  );
}

