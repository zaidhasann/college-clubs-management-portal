'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Club } from '@/types/index';
import PhotoGallery from '@/components/ui/PhotoGallery';

interface ClubCardProps {
  club: Club;
  onJoinClick?: (clubId: string) => void;
  isJoining?: boolean;
  joinStatus?: 'pending' | 'approved' | null;
}

export default function ClubCard({
  club,
  onJoinClick,
  isJoining = false,
  joinStatus,
}: ClubCardProps) {
  const [showPhotos, setShowPhotos] = useState(false);
  const photos = club.photos || [];
  const mainPhoto = club.mainPhoto || photos[0];

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:bg-zinc-800 transition">
        {/* Photo Section */}
        <div className="relative h-40 bg-zinc-800 group cursor-pointer">
          {mainPhoto ? (
            <>
              <Image
                src={mainPhoto}
                alt={club.name}
                fill
                className="object-cover group-hover:opacity-80 transition"
                unoptimized
              />
              {photos.length > 0 && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center"
                  onClick={() => setShowPhotos(true)}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition">
                    <div className="bg-black bg-opacity-70 px-3 py-2 rounded-lg">
                      <p className="text-white text-sm font-semibold">
                        {photos.length} photo{photos.length !== 1 ? 's' : ''}
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

        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-lg">{club.name}</h3>

          <p className="text-sm text-zinc-400 line-clamp-2">{club.description}</p>

          <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
            <span className="text-xs text-zinc-500">
              {club.members?.length || 0} members
            </span>

            {onJoinClick && (
              <button
                onClick={() => onJoinClick(club._id)}
                disabled={isJoining || joinStatus === 'pending'}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  joinStatus === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400 cursor-default'
                    : club.members?.includes(
                        typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''
                      )
                    ? 'bg-green-500/20 text-green-400 cursor-default'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {joinStatus === 'pending'
                  ? 'Pending'
                  : club.members?.includes(
                      typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''
                    )
                  ? 'Joined'
                  : isJoining
                  ? 'Joining...'
                  : 'Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      <PhotoGallery
        photos={photos}
        mainPhoto={mainPhoto}
        title={`${club.name} Photos`}
        isOpen={showPhotos}
        onClose={() => setShowPhotos(false)}
      />
    </>
  );
}
