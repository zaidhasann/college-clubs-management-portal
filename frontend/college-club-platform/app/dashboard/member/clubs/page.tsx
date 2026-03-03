"use client";

import { useEffect, useState } from "react";
import { useMemberRoute } from "@/hooks/useProtectedRoute";
import { clubsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ClubCard from "@/components/clubs/ClubCard";

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

interface JoinRequestStatus {
  request?: {
    _id: string;
    status: "pending" | "approved" | "rejected";
  };
  status: "pending" | "approved" | null;
}

export default function MemberClubsPage() {
  const { user, loading } = useMemberRoute();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [pendingClubs, setPendingClubs] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setClubsLoading(true);
        const data = await clubsAPI.getAll();
        setClubs(data);

        // Get list of joined clubs and pending requests
        if (user) {
          const joined = data
            .filter((club: Club) =>
              club.members.some((member: any) => member._id === user.id)
            )
            .map((club: Club) => club._id);
          setJoinedClubs(joined);

          // Check join request status for each club
          const pending: string[] = [];
          for (const club of data) {
            try {
              const statusResponse = await fetch(
                `/api/clubs/${club._id}/join-status`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );
              if (statusResponse.ok) {
                const statusData: JoinRequestStatus = await statusResponse.json();
                if (statusData.status === "pending") {
                  pending.push(club._id);
                }
              }
            } catch (err) {
              // Silently handle error for individual status checks
            }
          }
          setPendingClubs(pending);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load clubs");
      } finally {
        setClubsLoading(false);
      }
    };

    if (!loading) {
      fetchClubs();
    }
  }, [loading, user]);

  const handleJoinClub = async (clubId: string) => {
    try {
      setError("");
      setJoining(clubId);

      await clubsAPI.join(clubId);
      setPendingClubs([...pendingClubs, clubId]);

      // Refresh club data
      const data = await clubsAPI.getAll();
      setClubs(data);
    } catch (err) {
      setError((err as Error).message || "Failed to request club join");
    } finally {
      setJoining(null);
    }
  };

  if (loading || clubsLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Clubs</h2>
        <p className="text-zinc-400 mt-1">
          Browse and request to join clubs to view their photos and events
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {clubs.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">🏛️</div>
          <p className="text-zinc-400">No clubs available yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => {
            const isMember = joinedClubs.includes(club._id);
            const isPending = pendingClubs.includes(club._id);

            return (
              <ClubCard
                key={club._id}
                club={club}
                joinStatus={isPending ? "pending" : isMember ? "approved" : null}
                isJoining={joining === club._id}
                onJoinClick={() => {
                  if (!isMember && !isPending) {
                    handleJoinClub(club._id);
                  }
                }}
              />
            );
          })}
        </div>
      )}

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-400 text-sm">
        <p className="font-semibold mb-2">💡 How it works:</p>
        <ul className="space-y-1 text-xs">
          <li>• Browse all available clubs and photos</li>
          <li>• Click the photo area to view all club photos</li>
          <li>• Request to join a club (admin approval required)</li>
          <li>• Once approved, you'll be a full member</li>
        </ul>
      </div>
    </div>
  );
}
