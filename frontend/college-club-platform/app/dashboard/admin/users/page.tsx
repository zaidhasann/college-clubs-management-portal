"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { clubsAPI, usersAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  createdAt: string;
}

interface ClubMember {
  _id: string;
  name: string;
  email: string;
  joinedAt?: string;
}

interface Club {
  _id: string;
  name: string;
  members: ClubMember[];
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { user, loading } = useAdminRoute();
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [club, setClub] = useState<Club | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if user is main admin
  useEffect(() => {
    const checkIfMainAdmin = async () => {
      try {
        if (!user || user.role !== "admin") {
          setIsMainAdmin(false);
          setCheckingAdmin(false);
          return;
        }

        const users = await usersAPI.getAll();
        const admins = users.filter((u: any) => u.role === "admin");

        if (admins.length === 0) {
          setIsMainAdmin(false);
          setCheckingAdmin(false);
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
        setCheckingAdmin(false);
      }
    };

    if (!loading) {
      checkIfMainAdmin();
    }
  }, [user, loading]);

  // Fetch data based on admin type
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        if (isMainAdmin) {
          // Main admin: fetch all users
          const users = await usersAPI.getAll();
          setAllUsers(users);
        } else {
          // Sub-admin: fetch only club members
          const clubData = await clubsAPI.getMyClub();
          setClub(clubData);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load data");
      } finally {
        setDataLoading(false);
      }
    };

    if (!checkingAdmin) {
      fetchData();
    }
  }, [checkingAdmin, isMainAdmin]);

  const displayData = isMainAdmin ? allUsers : club?.members || [];

  const handleRemoveMember = async (memberId: string) => {
    if (!club) return;
    if (!confirm("Are you sure you want to remove this member from the club?"))
      return;

    try {
      setError("");
      setSuccess("");

      // Update club by removing member from members array
      const updatedMembers = club.members.filter((m) => m._id !== memberId);
      const updatedClub = { ...club, members: updatedMembers };
      
      await clubsAPI.update(club._id, updatedClub);
      setClub(updatedClub);
      setSuccess("Member removed from club!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to remove member");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone."))
      return;

    try {
      setError("");
      setSuccess("");
      await usersAPI.delete(userId);

      // Update local state
      setAllUsers(allUsers.filter((u) => u._id !== userId));
      setSuccess("User deleted successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to delete user");
    }
  };

  if (loading || checkingAdmin || dataLoading) {
    return <SkeletonTable count={6} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isMainAdmin ? "User Management" : "Club Members"}
        </h2>
        <p className="text-zinc-400 mt-1">
          {isMainAdmin
            ? "Manage all users in the system"
            : "Manage members of your club"}
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

      {isMainAdmin ? (
        // MAIN ADMIN VIEW - Show all users
        allUsers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No Users Yet"
            description="Users will appear here as they register for the platform"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Name
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Role
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Joined
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                  >
                    <td className="py-4 px-4">{u.name}</td>
                    <td className="py-4 px-4 text-zinc-400">{u.email}</td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={u.role === "admin" ? "success" : "info"}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-zinc-400 text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {u._id !== user?.id ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(u._id)}
                        >
                          Delete
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-500">(You)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // SUB-ADMIN VIEW - Show only club members
        !club ? (
          <EmptyState
            icon="🏢"
            title="No Club Assigned"
            description="Contact the main administrator to assign you a club to manage"
          />
        ) : club.members.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No Members Yet"
            description="Members will appear here once they request to join your club"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Name
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Joined
                  </th>
                  <th className="text-left py-4 px-4 text-zinc-300 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {club.members.map((member) => (
                  <tr
                    key={member._id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                  >
                    <td className="py-4 px-4">
                      {member.name}
                      {member._id === user?.id && (
                        <span className="text-xs text-blue-400 ml-2">(You)</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-zinc-400">{member.email}</td>
                    <td className="py-4 px-4 text-zinc-400 text-sm">
                      {new Date(member.joinedAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {member._id !== user?.id ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveMember(member._id)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-500">(Admin)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-400 text-sm">
        <p className="font-semibold mb-2">💡 {isMainAdmin ? "User Management" : "Club Members"}:</p>
        <ul className="space-y-1 text-xs">
          {isMainAdmin ? (
            <>
              <li>• View all users and their roles in the system</li>
              <li>• Users are automatically registered as members</li>
              <li>• Admins can approve additional admin requests</li>
            </>
          ) : (
            <>
              <li>• This page shows only members of your club</li>
              <li>
                • Members automatically join after their club join request is
                approved
              </li>
              <li>• You can remove members from the club here</li>
              <li>
                • Removed members will need to rejoin and get approval again
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
