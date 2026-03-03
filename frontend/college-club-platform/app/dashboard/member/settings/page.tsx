"use client";

import { useState, useEffect } from "react";
import { useMemberRoute } from "@/hooks/useProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export default function MemberSettingsPage() {
  const { user } = useMemberRoute();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "preferences">("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
  });

  // Security State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification State
  const [notifications, setNotifications] = useState({
    emailOnEventCreated: true,
    emailOnEventReminder: true,
    emailOnApprovalStatus: true,
    emailDigest: "weekly" as "daily" | "weekly" | "monthly" | "never",
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: "dark" as "dark" | "light",
    timezone: "UTC",
    dateFormat: "DD/MM/YYYY",
  });

  // Load saved settings from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem("memberNotifications");
    const savedPreferences = localStorage.getItem("memberPreferences");

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Handle Profile Update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (!profileData.name.trim()) {
        setError("Name is required");
        return;
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!passwordData.currentPassword) {
        setError("Current password is required");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError("New password must be at least 8 characters");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError((err as Error).message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Handle Notifications Save
  const handleNotificationsSave = () => {
    setError("");
    localStorage.setItem("memberNotifications", JSON.stringify(notifications));
    setSuccess("Notification preferences saved!");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Handle Preferences Save
  const handlePreferencesSave = () => {
    setError("");
    localStorage.setItem("memberPreferences", JSON.stringify(preferences));
    setSuccess("Preferences saved!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Settings</h2>
        <p className="text-xs sm:text-sm text-zinc-300 mt-1">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-500/30 border border-red-400/50 rounded-xl text-red-200 backdrop-blur-md text-sm sm:text-base">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 sm:p-4 bg-green-500/30 border border-green-400/50 rounded-xl text-green-200 backdrop-blur-md text-sm sm:text-base">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {(["profile", "security", "notifications", "preferences"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === tab
                ? "bg-blue-500/40 backdrop-blur-xl border border-blue-400/40 text-blue-100 shadow-lg"
                : "bg-white/10 backdrop-blur-xl border border-white/20 text-zinc-300 hover:bg-white/15"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Settings */}
      {activeTab === "profile" && (
        <Card className="space-y-6 backdrop-blur-xl border-white/30 shadow-xl">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Profile Information</h3>
            <p className="text-xs sm:text-sm text-zinc-400">Update your personal details</p>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl font-bold">
                {user?.name?.charAt(0) || "M"}
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold">Profile Avatar</p>
                <p className="text-xs text-zinc-400">Your initials displayed as avatar</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="text-sm font-semibold block mb-2">Full Name</label>
              <Input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Email Address</label>
              <Input
                type="email"
                value={profileData.email}
                disabled
                placeholder="Your email"
                className="w-full opacity-60"
              />
              <p className="text-xs text-zinc-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell us about yourself (optional)"
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none resize-none"
                rows={4}
              />
              <p className="text-xs text-zinc-400 mt-1">0/500 characters</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button variant="primary" className="w-full sm:w-auto" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <Card className="space-y-6 backdrop-blur-xl border-white/30 shadow-xl">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Security Settings</h3>
            <p className="text-xs sm:text-sm text-zinc-400">Manage your password and security options</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter your current password"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password (min 8 characters)"
                className="w-full"
              />
              <p className="text-xs text-zinc-400 mt-1">Must be at least 8 characters long</p>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Confirm Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm your new password"
                className="w-full"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button variant="primary" className="w-full sm:w-auto" disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </form>

          {/* Login Activity */}
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-base font-semibold mb-3">Login Activity</h4>
            <div className="space-y-2">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold">Current Session</p>
                    <p className="text-xs text-zinc-400">Windows Chrome</p>
                  </div>
                  <Badge variant="success">Active Now</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications Settings */}
      {activeTab === "notifications" && (
        <Card className="space-y-6 backdrop-blur-xl border-white/30 shadow-xl">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Notification Preferences</h3>
            <p className="text-xs sm:text-sm text-zinc-400">Control how you receive updates</p>
          </div>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="space-y-3">
              <label className="text-sm font-semibold block">Email Notifications</label>

              {[
                { key: "emailOnEventCreated", label: "New Events Created" },
                { key: "emailOnEventReminder", label: "Event Reminders" },
                { key: "emailOnApprovalStatus", label: "Registration Status Updates" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/15 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications] as boolean}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>

            {/* Email Digest */}
            <div className="border-t border-white/10 pt-4">
              <label className="text-sm font-semibold block mb-3">Email Digest Frequency</label>
              <select
                value={notifications.emailDigest}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    emailDigest: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button variant="primary" className="w-full sm:w-auto" onClick={handleNotificationsSave}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Preferences */}
      {activeTab === "preferences" && (
        <Card className="space-y-6 backdrop-blur-xl border-white/30 shadow-xl">
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">System Preferences</h3>
            <p className="text-xs sm:text-sm text-zinc-400">Customize your experience</p>
          </div>

          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label className="text-sm font-semibold block mb-3">Theme</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "dark", label: "🌙 Dark Mode" },
                  { value: "light", label: "☀️ Light Mode" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPreferences({ ...preferences, theme: option.value as any })}
                    className={`p-3 rounded-lg border transition text-sm font-medium ${
                      preferences.theme === option.value
                        ? "bg-blue-500/40 backdrop-blur-xl border-blue-400/40 text-blue-100 shadow-lg"
                        : "bg-white/10 backdrop-blur-md border-white/20 text-zinc-300 hover:bg-white/15"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div className="border-t border-white/10 pt-4">
              <label className="text-sm font-semibold block mb-2">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none"
              >
                <option>UTC</option>
                <option>GMT+5:30 (IST - India)</option>
                <option>GMT+8:00 (CST - China)</option>
                <option>UTC-5:00 (EST - USA)</option>
                <option>GMT+1:00 (CET - Europe)</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="border-t border-white/10 pt-4">
              <label className="text-sm font-semibold block mb-3">Date Format</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((format) => (
                  <button
                    key={format}
                    onClick={() => setPreferences({ ...preferences, dateFormat: format })}
                    className={`p-2 rounded-lg border transition text-xs sm:text-sm font-medium ${
                      preferences.dateFormat === format
                        ? "bg-blue-500/40 backdrop-blur-xl border-blue-400/40 text-blue-100"
                        : "bg-white/10 backdrop-blur-md border-white/20 text-zinc-300 hover:bg-white/15"
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button variant="primary" className="w-full sm:w-auto" onClick={handlePreferencesSave}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="space-y-4 bg-red-500/10 border-red-400/30 backdrop-blur-xl shadow-xl">
        <h3 className="text-lg font-bold text-red-400">⚠️ Danger Zone</h3>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold mb-2">Logout from All Devices</p>
            <p className="text-xs text-zinc-400 mb-3">You'll be logged out from all active sessions</p>
            <Button variant="secondary" className="w-full sm:w-auto text-xs sm:text-sm">
              Logout All Sessions
            </Button>
          </div>

          <div className="border-t border-red-400/20 pt-3">
            <p className="text-sm font-semibold mb-2">Delete Account</p>
            <p className="text-xs text-zinc-400 mb-3">Permanently delete your account and all data</p>
            <Button variant="secondary" className="w-full sm:w-auto text-xs sm:text-sm">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
