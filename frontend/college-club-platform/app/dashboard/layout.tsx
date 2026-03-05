"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usersAPI, clubsAPI, clubJoinRequestAPI } from "@/lib/api";
import SearchBar from "@/components/layout/SearchBar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [adminClubId, setAdminClubId] = useState<string | null>(null);

  const baseAdminLinks = [
    { name: "Dashboard", href: "/dashboard/admin", icon: "📊" },
    { name: "Admin Requests", href: "/dashboard/admin/admin-requests", icon: "✅" },
    { name: "Club Join Requests", href: "/dashboard/admin/club-join-requests", icon: "🎯" },
    { name: "Users", href: "/dashboard/admin/users", icon: "👥" },
    { name: "Clubs", href: "/dashboard/admin/clubs", icon: "🏢" },
    { name: "Events", href: "/dashboard/admin/events", icon: "📅" },
    { name: "Settings", href: "/dashboard/admin/settings", icon: "⚙️" },
  ];

  const memberLinks = [
    { name: "Dashboard", href: "/dashboard/member", icon: "📊" },
    { name: "Clubs", href: "/dashboard/member/clubs", icon: "🏢" },
    { name: "Events", href: "/dashboard/member/events", icon: "📅" },
    { name: "My Registrations", href: "/dashboard/member/my-registrations", icon: "📋" },
  ];

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

  // Fetch pending requests count for sub-admins
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        if (!user || user.role !== "admin" || isMainAdmin) {
          setPendingRequestCount(0);
          return;
        }

        // For sub-admins, get their club and fetch pending requests
        const clubData = await clubsAPI.getMyClub();
        setAdminClubId(clubData._id);

        const requests = await clubJoinRequestAPI.getPending(clubData._id);
        setPendingRequestCount(requests.length);
      } catch (err) {
        console.error("Error fetching pending requests:", err);
        setPendingRequestCount(0);
      }
    };

    if (!checkingAdmin) {
      fetchPendingRequests();
    }
  }, [checkingAdmin, user, isMainAdmin]);

  // Filter admin links: remove "Admin Requests" if not main admin
  const adminLinks = isMainAdmin 
    ? baseAdminLinks 
    : baseAdminLinks.filter(link => link.name !== "Admin Requests");

  const links = user?.role === "admin" ? adminLinks : memberLinks;

  if (loading || checkingAdmin) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* ================= Sidebar (Desktop Only) ================= */}
      <aside className="hidden md:flex md:w-64 bg-black border-r border-zinc-800 p-6 flex-col">
        <h1 className="text-2xl font-bold mb-10">Club<span className="text-red-500">मंच</span></h1>

        <nav className="flex flex-col gap-3">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const showBadge = link.name === "Club Join Requests" && pendingRequestCount > 0;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-3 relative ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <span className="text-lg">{(link as any).icon}</span>
                {link.name}
                {showBadge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {pendingRequestCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-auto w-full px-4 py-2 bg-red-900 text-red-200 rounded-lg hover:bg-red-800 transition text-sm"
        >
          Logout
        </button>
      </aside>

      {/* ================= Main Section ================= */}
      <div className="flex-1 flex flex-col w-full">
        {/* -------- Topbar -------- */}
        <header className="h-14 sm:h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-6 gap-4">
          {/* Hamburger Menu (Mobile Only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-zinc-800 transition"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col gap-1">
              <span className={`h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
              <span className={`h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </div>
          </button>

          {/* Dashboard Title */}
          <h2 className="text-sm sm:text-lg font-semibold hidden sm:block">
            {user?.role === "admin" ? "Admin" : "Member"}
          </h2>

          {/* Search Bar */}
          <SearchBar />

          {/* User Info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-right">
              <div className="text-zinc-300 truncate">{user?.name}</div>
              <div className="text-zinc-500 text-xs capitalize">
                {user?.role}
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* -------- Mobile Menu (Mobile Only) -------- */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-b border-zinc-800 p-4 space-y-2 animate-in slide-in-from-top duration-200">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const showBadge = link.name === "Club Join Requests" && pendingRequestCount > 0;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm relative ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <span>{(link as any).icon}</span>
                  {link.name}
                  {showBadge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                      {pendingRequestCount}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full px-4 py-3 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition text-sm font-medium border border-red-800/30"
            >
              Logout
            </button>
          </div>
        )}

        {/* -------- Page Content -------- */}
        <main className="p-3 sm:p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );

}