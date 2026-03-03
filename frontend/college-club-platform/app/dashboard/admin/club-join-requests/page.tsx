"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { clubsAPI, clubJoinRequestAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface ClubJoinRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  clubId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    name: string;
  };
}

interface Club {
  _id: string;
  name: string;
  members: any[];
}

export default function ClubJoinRequestsPage() {
  const router = useRouter();
  const { user, loading } = useAdminRoute();
  const [club, setClub] = useState<Club | null>(null);
  const [requests, setRequests] = useState<ClubJoinRequest[]>([]);
  const [clubLoading, setClubLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  // Fetch admin's club
  useEffect(() => {
    const fetchClub = async () => {
      try {
        setClubLoading(true);
        const data = await clubsAPI.getMyClub();
        setClub(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load club");
      } finally {
        setClubLoading(false);
      }
    };

    if (!loading) {
      fetchClub();
    }
  }, [loading]);

  // Fetch club join requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!club) return;

      try {
        setRequestsLoading(true);
        const data =
          filter === "pending"
            ? await clubJoinRequestAPI.getPending(club._id)
            : await clubJoinRequestAPI.getAll(club._id);
        setRequests(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load requests");
      } finally {
        setRequestsLoading(false);
      }
    };

    if (club && !clubLoading) {
      fetchRequests();
    }
  }, [club, clubLoading, filter]);

  const handleApprove = async (requestId: string) => {
    if (!club) return;

    try {
      setError("");
      setSuccess("");
      await clubJoinRequestAPI.approve(club._id, requestId);

      setRequests(
        requests.map((r) =>
          r._id === requestId ? { ...r, status: "approved" } : r
        )
      );
      setSuccess("Join request approved!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to approve request");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!club) return;

    try {
      setError("");
      setSuccess("");
      await clubJoinRequestAPI.reject(club._id, requestId);

      setRequests(
        requests.map((r) =>
          r._id === requestId ? { ...r, status: "rejected" } : r
        )
      );
      setSuccess("Join request rejected!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to reject request");
    }
  };

  if (loading || clubLoading) {
    return <SkeletonTable count={5} />;
  }

  if (!club) {
    return (
      <EmptyState
        icon="🤔"
        title="No Club Assigned"
        description="Contact the main administrator to assign you a club to manage"
      />
    );
  }

  const filteredRequests = filter === "pending" 
    ? requests.filter((r) => r.status === "pending")
    : requests;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Club Join Requests</h2>
        <p className="text-zinc-400 mt-1">
          Review and approve member requests to join {club.name}
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

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "pending"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          Pending ({requests.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          All ({requests.length})
        </button>
      </div>

      {requestsLoading ? (
        <SkeletonTable count={4} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filter === "pending" ? "No Pending Requests" : "No Requests"}
          description={
            filter === "pending"
              ? "All membership requests have been reviewed"
              : "No join requests on record"
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {request.userId.name}
                    </h3>
                    <Badge
                      variant={
                        request.status === "pending"
                          ? "warning"
                          : request.status === "approved"
                          ? "success"
                          : "danger"
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">{request.userId.email}</p>
                  <p className="text-xs text-zinc-500">
                    Requested on{" "}
                    {new Date(request.requestedAt).toLocaleDateString()}{" "}
                    {new Date(request.requestedAt).toLocaleTimeString()}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(request._id)}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(request._id)}
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}

                {request.status === "approved" && request.approvedBy && (
                  <div className="text-right">
                    <p className="text-xs text-green-400">
                      Approved by {request.approvedBy.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(request.approvedAt || "").toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-400 text-sm">
        <p className="font-semibold mb-2">💡 How it works:</p>
        <ul className="space-y-1 text-xs">
          <li>• Members request to join your club from the clubs page</li>
          <li>• Pending requests appear here and need your approval</li>
          <li>• Once approved, members automatically join your club</li>
          <li>• Rejected requests won't appear in your club member list</li>
        </ul>
      </div>
    </div>
  );
}
