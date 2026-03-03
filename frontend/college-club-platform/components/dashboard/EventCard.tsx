'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Event } from "@/types/index";
import PhotoGallery from '@/components/ui/PhotoGallery';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [showPhotos, setShowPhotos] = useState(false);
  const photos = event.photos || [];
  const mainPhoto = event.mainPhoto || photos[0];
  const hasAdditionalPhotos = photos.length > 1 || (mainPhoto && photos.length > 0 && mainPhoto !== photos[0]);

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:bg-zinc-800 transition">
        {/* Photo Section */}
        <div className="relative h-40 bg-zinc-800 group cursor-pointer">
          {mainPhoto ? (
            <>
              <Image
                src={mainPhoto}
                alt={event.title}
                fill
                className="object-cover group-hover:opacity-80 transition"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23404040' width='100' height='100'/%3E%3C/svg%3E";
                }}
              />
              {hasAdditionalPhotos && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center"
                  onClick={() => setShowPhotos(true)}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <div className="bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                      <p className="text-white text-sm font-semibold">
                        +{photos.length - 1} more photo{photos.length - 1 !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              {photos.length > 0 ? (
                <button
                  onClick={() => setShowPhotos(true)}
                  className="hover:text-zinc-400 transition"
                >
                  <span className="text-sm">📸 {photos.length} photos</span>
                </button>
              ) : (
                <span className="text-sm">📸 No photo</span>
              )}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg">
            {event.title}
          </h3>

          <p className="text-sm text-zinc-400">
            {new Date(event.date).toDateString()}
          </p>

          <div className="flex justify-between items-center">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                event.status === "upcoming"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {event.status}
            </span>

            <span className="text-xs text-zinc-500">
              {event.registrationsCount} registrations
            </span>
          </div>
        </div>
      </div>

      <PhotoGallery
        photos={photos}
        mainPhoto={mainPhoto}
        title={`${event.title} Photos`}
        isOpen={showPhotos}
        onClose={() => setShowPhotos(false)}
      />
    </>
  );
}