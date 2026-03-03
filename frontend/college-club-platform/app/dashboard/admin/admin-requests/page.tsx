"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { adminRequestsAPI, usersAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

interface AdminRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    name: string;
  };
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const { user, loading } = useAdminRoute();
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  // Check if user is the main admin (first admin by creation date)
  useEffect(() => {
    const checkIfMainAdmin = async () => {
      try {
        if (!user) return;
        
        const users = await usersAPI.getAll();
        const admins = users.filter((u: any) => u.role === "admin");
        
        if (admins.length === 0) {
          setIsMainAdmin(false);
          return;
        }

        // Sort by createdAt and get the first (main) admin
        const mainAdmin = admins.sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];

        setIsMainAdmin(mainAdmin._id === user.id);
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsMainAdmin(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!loading) {
      checkIfMainAdmin();
    }
  }, [user, loading]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setRequestsLoading(true);
        const data = filter === "pending" 
          ? await adminRequestsAPI.getPending()
          : await adminRequestsAPI.getAll();
        setRequests(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load requests");
      } finally {
        setRequestsLoading(false);
      }
    };

    if (!loading && isMainAdmin) {
      fetchRequests();
    }
  }, [loading, isMainAdmin, filter]);

  const handleApprove = async (requestId: string) => {
    try {
      setError("");
      setSuccess("");
      await adminRequestsAPI.approve(requestId);
      
      setRequests(
        requests.map((r) =>
          r._id === requestId ? { ...r, status: "approved" } : r
        )
      );
      setSuccess("Admin request approved!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to approve");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setError("");
      setSuccess("");
      await adminRequestsAPI.reject(requestId);
      
      setRequests(
        requests.map((r) =>
          r._id === requestId ? { ...r, status: "rejected" } : r
        )
      );
      setSuccess("Admin request rejected!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to reject");
    }
  };

  if (loading || checkingAccess) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!isMainAdmin) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl font-semibold mb-2">Access Denied</p>
          <p className="text-zinc-400">
            Only the main admin can manage admin requests
          </p>
        </Card>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Requests</h2>
        <p className="text-zinc-400 mt-1">
          Approve or reject admin access requests ({pendingCount} pending)
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

      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "primary" : "secondary"}
          onClick={() => setFilter("pending")}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={filter === "all" ? "primary" : "secondary"}
          onClick={() => setFilter("all")}
        >
          All Requests
        </Button>
      </div>

      {requestsLoading ? (
        <div className="text-zinc-400">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-zinc-400">
            {filter === "pending"
              ? "No pending requests"
              : "No admin requests yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request._id}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{request.name}</h3>
                    <p className="text-zinc-400 text-sm">{request.email}</p>
                  </div>
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

                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                  <p className="text-sm text-zinc-300">
                    <strong>Reason:</strong> {request.reason}
                  </p>
                </div>

                <div className="text-xs text-zinc-500">
                  Requested on{" "}
                  {new Date(request.requestedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {request.status === "pending" ? (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(request._id)}
                      className="flex-1"
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(request._id)}
                      className="flex-1"
                    >
                      ✕ Reject
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 pt-2">
                    {request.status === "approved"
                      ? `Approved by ${request.approvedBy?.name || "Admin"}`
                      : "Rejected"}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
