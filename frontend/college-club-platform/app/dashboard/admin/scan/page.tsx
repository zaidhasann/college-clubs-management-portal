"use client";

import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage() {

  useEffect(() => {

    const scanner = new Html5Qrcode("reader");

    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {

        console.log("QR Code:", decodedText);

        fetch("http://localhost:5000/api/attendance/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            qrData: decodedText
          })
        })
          .then((res) => res.json())
          .then((data) => {
            alert(data.message);
          });

      },
      (error) => {
        console.log(error);
      }
    );

    return () => {
      scanner.stop().catch(() => {});
    };

  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Scan Event QR</h1>

      <div
        id="reader"
        className="w-[320px] bg-black rounded-lg"
      ></div>
    </div>
  );
}