'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PhotoGalleryProps {
  photos: string[];
  mainPhoto?: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoGallery({
  photos,
  mainPhoto,
  title,
  isOpen,
  onClose,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(mainPhoto || photos[0] || '');

  if (!isOpen) return null;

  const displayPhotos = photos && photos.length > 0 ? photos : [];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {displayPhotos.length > 0 ? (
            <>
              {/* Main Photo */}
              <div className="mb-6">
                <div className="relative w-full h-96 bg-zinc-800 rounded-lg overflow-hidden mb-2">
                  {selectedPhoto && (
                    <Image
                      src={selectedPhoto}
                      alt={title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                {mainPhoto && (
                  <p className="text-xs text-zinc-400 text-center">Main Photo</p>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {displayPhotos.length > 1 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-zinc-300">
                    All Photos ({displayPhotos.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {displayPhotos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPhoto(photo)}
                        className={`relative h-24 rounded-lg overflow-hidden border-2 transition ${
                          selectedPhoto === photo
                            ? 'border-green-500'
                            : 'border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <Image
                          src={photo}
                          alt={`${title} photo ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {mainPhoto === photo && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-400">No photos available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
