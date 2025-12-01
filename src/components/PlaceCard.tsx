import type { MouseEvent } from 'react';

type Place = {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  photos: string[];
  priceRange?: string;
  tags?: string[];
  distance?: number;
  totalReviews?: number;
};

type PlaceCardProps = {
  place: Place;
  onClick?: () => void;
  onToggleSave?: (id: string) => void;
  isSaved?: boolean;
};

function formatDistance(distance?: number) {
  if (distance === undefined) return undefined;
  if (distance < 1) return `${Math.round(distance * 1000)} m`;
  return `${distance.toFixed(1)} km`;
}

function formatRating(rating: number) {
  return rating.toFixed(1);
}

export default function PlaceCard({ place, onClick, onToggleSave, isSaved }: PlaceCardProps) {
  const imageUrl = place.photos?.[0] ?? 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=800&fit=crop';
  const distanceLabel = formatDistance(place.distance);
  const saved = Boolean(isSaved);

  const handleSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleSave?.(place.id);
  };

  return (
    <article onClick={onClick} className="group cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className="relative h-[280px] overflow-hidden">
        <img
          src={imageUrl}
          alt={place.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/40" />
        {distanceLabel && (
          <span className="absolute top-4 left-4 text-xs font-medium tracking-[0.2em] uppercase text-white/90 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg">
            {distanceLabel}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold tracking-[0.25em] uppercase bg-white/80 backdrop-blur-md text-gray-900 hover:bg-white transition-all rounded-xl shadow-md hover:shadow-lg"
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transition-colors">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 transition-colors">{place.category}</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1 transition-colors">{place.name}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1 transition-colors">{place.address}</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 pt-4 transition-colors">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{formatRating(place.rating)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] transition-colors">rating</p>
          </div>
          {place.priceRange && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{place.priceRange}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] transition-colors">price range</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
