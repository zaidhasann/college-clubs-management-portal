"use client";

import { useEffect, useState, useRef } from "react";
import { useAdminRoute } from "@/hooks/useProtectedRoute";
import { eventsAPI, attendanceAPI } from "@/lib/api";
import { Event } from "@/types/index";

export default function ScanPage() {
  const { loading } = useAdminRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const scannerRef = useRef<any>(null);

  // Fetch events on mount
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
      setError("Failed to load events");
    }
  };

  const handleEventSelect = async (eventId: string) => {
    const event = events.find((e) => e._id === eventId);
    if (event) {
      setSelectedEvent(event);
      setResult(null);
      setError(null);
      setScanning(false);
      
      // Stop existing scanner if running
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.debug("Error stopping scanner:", err);
        }
      }

      // Fetch current attendance
      try {
        const data = await attendanceAPI.getAttendance(eventId);
        setAttendanceCount(data.attendanceCount || 0);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!selectedEvent) return;

    try {
      // The QR code should contain the user ID
      const userId = decodedText.trim();

      const result = await attendanceAPI.checkIn(selectedEvent._id, userId);

      setResult(`✓ ${result.user.name} checked in successfully!`);
      setError(null);
      setAttendanceCount(result.attendanceCount);

      // Stop scanner briefly to prevent duplicate scans
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.debug("Error stopping scanner:", err);
        }
      }
      setScanning(false);

      // Restart after 2 seconds
      setTimeout(() => {
        setResult(null);
        startScanning();
      }, 2000);
    } catch (error: any) {
      const errorMsg = error.message || "Check-in failed";
      setError(`✗ ${errorMsg}`);
      setResult(null);

      // Stop scanner briefly
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.debug("Error stopping scanner:", err);
        }
      }
      setScanning(false);

      // Retry after 2 seconds
      setTimeout(() => {
        setError(null);
        startScanning();
      }, 2000);
    }
  };

  const startScanning = async () => {
    if (!selectedEvent) {
      setError("Please select an event first");
      return;
    }

    try {
      setError(null);
      setResult(null);
      
      // Stop any existing scanner first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.debug("Error stopping previous scanner:", err);
        }
      }

      // Set scanning BEFORE creating scanner so div is visible
      setScanning(true);

      // Give the DOM a moment to render the div
      await new Promise(resolve => setTimeout(resolve, 100));

      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      // Check if div exists
      const readerDiv = document.getElementById("reader");
      if (!readerDiv) {
        throw new Error("Scanner container not found in DOM");
      }

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {
          // QR parse error on each frame — ignore silently
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setScanning(false);
      const errorMsg = err.message || "Could not start camera";
      
      if (errorMsg.includes("NotAllowedError")) {
        setError("Camera access denied. Please allow camera access in browser settings.");
      } else if (errorMsg.includes("NotFoundError")) {
        setError("No camera found on this device.");
      } else if (errorMsg.includes("NotSupportedError")) {
        setError("Your browser doesn't support camera access.");
      } else {
        setError(`Camera error: ${errorMsg}`);
      }
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
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Event Check-In</h1>
        <p className="text-zinc-400 mt-1">
          Scan QR codes to mark attendance at events
        </p>
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
      {result && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-center">
          {result}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-center">
          {error}
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
            id="reader"
            className={`${scanning ? "block" : "hidden"} w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden`}
            style={{ minHeight: "300px", aspectRatio: "1" }}
          ></div>

          {!scanning && (
            <div className="text-center py-12 text-zinc-400">
              Click "Start Scanning" to begin checking in attendees
            </div>
          )}
        </div>
      )}
    </div>
  );
}