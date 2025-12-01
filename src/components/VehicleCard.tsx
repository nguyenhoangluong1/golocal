import type { MouseEvent } from 'react';
import { Star } from 'lucide-react';

type Vehicle = {
  id: string;
  name: string;
  type: string;
  brand: string;
  pricePerDay: number;
  location: string;
  images: string[];
  rating: number;
  verified?: boolean;
  owner: {
    name: string;
    avatar: string;
    rating: number;
  };
  distance?: number;
};

type VehicleCardProps = {
  vehicle: Vehicle;
  onClick?: () => void;
  onToggleSave?: (id: string) => void;
  isSaved?: boolean;
  layout?: 'grid' | 'featured';
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDistance = (distance?: number) => {
  if (!distance) return null;
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
};

export default function VehicleCard({
  vehicle,
  onClick,
  onToggleSave,
  isSaved,
  layout = 'grid',
}: VehicleCardProps) {
  const imageUrl = vehicle.images?.[0] ?? 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=800&fit=crop';
  const distanceLabel = formatDistance(vehicle.distance);
  const saved = Boolean(isSaved);

  const handleSave = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleSave?.(vehicle.id);
  };

  // Featured layout - large horizontal card
  if (layout === 'featured') {
    return (
      <article onClick={onClick} className="group cursor-pointer">
        <div className="grid gap-0 md:grid-cols-2 border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            <img
              src={imageUrl}
              alt={vehicle.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/20" />
            {distanceLabel && (
              <span className="absolute top-6 left-6 text-xs font-medium tracking-[0.3em] uppercase text-white/90 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg">
                {distanceLabel}
              </span>
            )}
            {vehicle.verified && (
              <span className="absolute top-6 right-6 px-4 py-2 text-xs font-semibold tracking-[0.3em] uppercase bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl shadow-lg">
                Verified
              </span>
            )}
          </div>

          <div className="flex flex-col justify-between p-10 lg:p-14 xl:p-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transition-colors">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 transition-colors">
                  {vehicle.location}
                </p>
                <h3 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">
                  {vehicle.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">{vehicle.type}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white transition-colors">{formatCurrency(vehicle.pricePerDay)}</span>
                <span className="text-lg text-gray-500 dark:text-gray-400 font-light transition-colors">per day</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 pt-8 transition-colors">
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-400 dark:text-gray-500 mb-1 transition-colors">Host</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{vehicle.owner.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-400 dark:text-gray-500 mb-1 transition-colors">Rating</p>
                <div className="flex items-center justify-end gap-2">
                  <Star size={20} className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100 transition-colors" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{vehicle.rating.toFixed(1)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 text-xs font-semibold tracking-[0.3em] uppercase border border-gray-900/50 dark:border-gray-100/50 text-gray-900 dark:text-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all rounded-xl shadow-md hover:shadow-lg"
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Grid layout - compact card
  return (
    <article onClick={onClick} className="group cursor-pointer border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className="relative h-[280px] overflow-hidden">
        <img
          src={imageUrl}
          alt={vehicle.name}
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
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 transition-colors">{vehicle.location}</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-1 transition-colors">{vehicle.name}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">{vehicle.type}</p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 pt-4 transition-colors">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{formatCurrency(vehicle.pricePerDay)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] transition-colors">per day</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Star size={16} className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-gray-100 transition-colors" />
              <p className="text-lg font-bold text-gray-900 dark:text-white transition-colors">{vehicle.rating.toFixed(1)}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] transition-colors">rating</p>
          </div>
        </div>
      </div>
    </article>
  );
}
