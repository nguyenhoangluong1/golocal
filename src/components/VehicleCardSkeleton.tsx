import Skeleton from './common/Skeleton';

interface VehicleCardSkeletonProps {
  layout?: 'grid' | 'featured';
}

export default function VehicleCardSkeleton({ layout = 'grid' }: VehicleCardSkeletonProps) {
  if (layout === 'featured') {
    return (
      <article className="group">
        <div className="grid gap-0 md:grid-cols-2 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          {/* Image */}
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            <Skeleton variant="rectangular" className="w-full h-full" />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between p-10 lg:p-14 xl:p-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="circular" width={24} height={24} />
              </div>
              <Skeleton variant="text" width="80%" height={32} className="mb-3" />
              <Skeleton variant="text" width="100%" height={20} className="mb-2" />
              <Skeleton variant="text" width="90%" height={20} className="mb-4" />
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={100} height={24} />
                <Skeleton variant="rounded" width={70} height={24} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="text" width={80} height={16} className="mt-1" />
              </div>
              <Skeleton variant="rounded" width={140} height={48} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Grid layout
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
            <Skeleton variant="text" width="70%" height={24} className="mb-2" />
            <Skeleton variant="text" width="50%" height={20} />
          </div>
          <Skeleton variant="circular" width={20} height={20} />
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Skeleton variant="rounded" width={60} height={20} />
          <Skeleton variant="rounded" width={80} height={20} />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="text" width={60} height={16} className="mt-1" />
          </div>
          <Skeleton variant="rounded" width={100} height={36} />
        </div>
      </div>
    </article>
  );
}

