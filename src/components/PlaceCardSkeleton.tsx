import Skeleton from './common/Skeleton';

export default function PlaceCardSkeleton() {
  return (
    <article className="group border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      {/* Image */}
      <div className="relative h-[280px] overflow-hidden">
        <Skeleton variant="rectangular" className="w-full h-full" />
      </div>

      {/* Content */}
      <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton variant="text" width="75%" height={24} className="mb-2" />
            <Skeleton variant="text" width="55%" height={20} />
          </div>
          <Skeleton variant="circular" width={20} height={20} />
        </div>

        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="90%" height={16} className="mb-4" />

        <div className="flex items-center gap-2 mb-4">
          <Skeleton variant="rounded" width={50} height={20} />
          <Skeleton variant="rounded" width={60} height={20} />
          <Skeleton variant="rounded" width={70} height={20} />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Skeleton variant="text" width={80} height={20} />
          <Skeleton variant="rounded" width={100} height={36} />
        </div>
      </div>
    </article>
  );
}

