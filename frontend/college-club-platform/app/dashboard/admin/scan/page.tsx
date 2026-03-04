"use client";

import { useEffect, useState, useRef } from "react";

export default function ScanPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!isMounted) return;

        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Stop scanning after a successful read
            await scanner.stop().catch(() => {});
            setScanning(false);

            console.log("QR Code:", decodedText);

            const token = localStorage.getItem("token");

            try {
              const res = await fetch("http://localhost:5000/api/events/checkin", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ qrCode: decodedText }),
              });

              const data = await res.json();

              if (res.ok) {
                setResult(data.message || "Check-in successful!");
                setError(null);
              } else {
                setError(data.error || "Check-in failed");
                setResult(null);
              }
            } catch (err) {
              setError("Network error — is the server running?");
            }
          },
          () => {
            // QR parse error on each frame — ignore silently
          }
        );
      } catch (err) {
        if (isMounted) {
          setError("Could not start camera. Please allow camera access.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleRescan = async () => {
    setResult(null);
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop().catch(() => {});
          setScanning(false);

          const token = localStorage.getItem("token");

          try {
            const res = await fetch("http://localhost:5000/api/events/checkin", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ qrCode: decodedText }),
            });

            const data = await res.json();

            if (res.ok) {
              setResult(data.message || "Check-in successful!");
              setError(null);
            } else {
              setError(data.error || "Check-in failed");
              setResult(null);
            }
          } catch (err) {
            setError("Network error — is the server running?");
          }
        },
        () => {}
      );
    } catch (err) {
      setError("Could not restart camera.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Scan Event QR</h1>

      <div
        id="reader"
        className="w-[320px] bg-black rounded-lg overflow-hidden"
      ></div>

      {result && (
        <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-center max-w-sm">
          ✅ {result}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-center max-w-sm">
          ❌ {error}
        </div>
      )}

      {!scanning && (
        <button
          onClick={handleRescan}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Scan Another
        </button>
      )}
    </div>
  );
}