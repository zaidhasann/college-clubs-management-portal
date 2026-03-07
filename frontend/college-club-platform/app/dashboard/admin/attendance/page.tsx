"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI, attendanceAPI } from "@/lib/api";
import { Event } from "@/types/index";

export default function AttendancePage() {
  const { loading } = useAdminRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [scanning, setScanning] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!loading) {
      fetchEvents();
    }
  }, [loading]);

  const fetchEvents = async () => {
    try {
      const data = await eventsAPI.getAll();
      // Only show upcoming events for check-in
      const upcomingEvents = data.filter(
        (event: Event) => event.status === "upcoming"
      );
      setEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleEventSelect = async (eventId: string) => {
    const event = events.find((e) => e._id === eventId);
    if (event) {
      setSelectedEvent(event);
      // Fetch current attendance
      try {
        const data = await attendanceAPI.getAttendance(eventId);
        setAttendees(data.attendance || []);
        setAttendanceCount(data.attendanceCount || 0);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!selectedEvent) return;

    try {
      // The QR code should contain the user ID
      const userId = decodedText.trim();

      const result = await attendanceAPI.checkIn(selectedEvent._id, userId);

      setMessage(`✓ ${result.user.name} checked in successfully!`);
      setMessageType("success");
      setAttendanceCount(result.attendanceCount);

      // Refresh attendance list
      const data = await attendanceAPI.getAttendance(selectedEvent._id);
      setAttendees(data.attendance || []);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(`✗ ${error.message || "Check-in failed"}`);
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleScanError = (error: any) => {
    // Ignore scan errors (they're frequent during scanning)
    console.debug("Scan error:", error);
  };

  const startScanning = async () => {
    if (!selectedEvent) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        handleScanError
      );

      setScanning(true);
    } catch (err) {
      console.error("Could not start scanner:", err);
      setMessage("Could not start camera. Please allow camera access.");
      setMessageType("error");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  const toggleScanning = () => {
    if (scanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Check-In</h1>
          <p className="text-zinc-400 mt-1">
            Scan QR codes to mark attendance at events
          </p>
        </div>
        <Link
          href="/dashboard/admin/attendance/reports"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          📊 View Reports
        </Link>
      </div>

      {/* Event Selection */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <label className="block text-sm font-medium mb-2">Select Event</label>
        <select
          value={selectedEvent?._id || ""}
          onChange={(e) => handleEventSelect(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose an event --</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title} - {new Date(event.date).toLocaleDateString()}
            </option>
          ))}
        </select>

        {selectedEvent && (
          <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
            <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
            <p className="text-zinc-400 text-sm mt-1">
              {new Date(selectedEvent.date).toLocaleString()}
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="text-blue-400">
                Registered: {selectedEvent.registrationsCount}
              </span>
              <span className="text-green-400">
                Attended: {attendanceCount}
              </span>
              <span className="text-zinc-400">
                Attendance:{" "}
                {selectedEvent.registrationsCount > 0
                  ? (
                      (attendanceCount / selectedEvent.registrationsCount) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-500/20 border border-green-500 text-green-400"
              : "bg-red-500/20 border border-red-500 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* QR Scanner */}
      {selectedEvent && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">QR Code Scanner</h2>
            <button
              onClick={toggleScanning}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                scanning
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {scanning ? "Stop Scanning" : "Start Scanning"}
            </button>
          </div>

          <div
            id="qr-reader"
            className={`${scanning ? "block" : "hidden"} bg-black rounded-lg overflow-hidden`}
          ></div>

          {!scanning && (
            <div className="text-center py-12 text-zinc-400">
              Click "Start Scanning" to begin checking in attendees
            </div>
          )}
        </div>
      )}

      {/* Attendees List */}
      {selectedEvent && attendees.length > 0 && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">
            Checked In ({attendanceCount})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {attendees.map((attendee: any, index) => (
              <div
                key={attendee._id || index}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{attendee.name}</p>
                  <p className="text-sm text-zinc-400">{attendee.email}</p>
                  {attendee.rollNumber && (
                    <p className="text-xs text-zinc-500">
                      Roll: {attendee.rollNumber}
                    </p>
                  )}
                </div>
                <div className="text-green-400 text-sm">✓ Present</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
