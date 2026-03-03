"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && user?.role !== "pending_admin") {
      router.push("/dashboard/member");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (user?.role !== "pending_admin") {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6 text-center">
          <div className="text-6xl">⏳</div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Pending Approval</h1>
            <p className="text-zinc-400 mb-4">
              Your admin access request is being reviewed
            </p>
          </div>

          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-400">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-zinc-400 mt-2 space-y-1">
              <li>✓ We've received your request</li>
              <li>✓ The main admin will review it soon</li>
              <li>✓ You'll get instant access once approved</li>
              <li>✓ Check back soon!</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-zinc-300 mb-2">Your Details:</p>
            <div className="space-y-1 text-sm text-zinc-400">
              <p><strong className="text-zinc-300">Name:</strong> {user?.name}</p>
              <p><strong className="text-zinc-300">Email:</strong> {user?.email}</p>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="primary"
            >
              Refresh Status
            </Button>
            <Button
              onClick={handleLogout}
              className="w-full"
              variant="secondary"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
