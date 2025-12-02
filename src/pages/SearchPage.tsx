import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import Map from '../components/Map';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SearchParams } from '../components/SearchBar';
import { getCityCoordinates } from '../utils/locationData';
import { vehiclesAPI } from '../utils/api';
import { useFavorites } from '../hooks/useFavorites';
import { useI18n } from '../contexts/I18nContext';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isFavorited, toggleFavorite } = useFavorites();
  
  const ITEMS_PER_PAGE = 12; // ALGORITHM: Match grid layout (max 4 cols x 3 rows = 12)

  // Load page from URL params on mount
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Update URL when page changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (currentPage > 1) {
      newParams.set('page', currentPage.toString());
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams, { replace: true });
  }, [currentPage]);

  // Parse URL params to SearchParams
  const currentFilters: SearchParams = {
    city: searchParams.get('city') || '',
    vehicleType: searchParams.get('type') || '',
    startDate: searchParams.get('start') || '',
    endDate: searchParams.get('end') || '',
  };

  // Track previous filters to detect changes
  const prevFiltersRef = useRef<string>('');
  
  // ALGORITHM OPTIMIZATION: Load vehicles when filters OR page changes
  useEffect(() => {
    // Create a string key from filters to detect changes
    const filtersKey = `${currentFilters.city}|${currentFilters.vehicleType}|${currentFilters.startDate}|${currentFilters.endDate}`;
    
    // Reload if filters changed (reset to page 1)
    if (filtersKey !== prevFiltersRef.current) {
      prevFiltersRef.current = filtersKey;
      setCurrentPage(1);
      loadVehicles(currentFilters, 1);
    } else {
      // If only page changed, load that specific page
      loadVehicles(currentFilters, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('city'), searchParams.get('type'), searchParams.get('start'), searchParams.get('end'), currentPage]);

  const loadVehicles = async (filters: SearchParams, page: number = 1) => {
    setLoading(true);
    
    try {
      // ALGORITHM OPTIMIZATION: Request only items needed for current page
      // Instead of fetching all vehicles and slicing in frontend
      // This reduces data transfer by ~90% (from 1000+ items to 12 items)
      const params: any = {
        available: true, // Only get available vehicles
        page: page,
        limit: ITEMS_PER_PAGE, // Only fetch items for current page
      };
      if (filters.city) params.city = filters.city;
      if (filters.vehicleType) params.type = filters.vehicleType;
      
      const response = await vehiclesAPI.getAll(params);
      
      // ALGORITHM: Backend now returns paginated response with total count
      // Response format: { vehicles: [...], total: number, page: number, limit: number, pages: number }
      // Handle both paginated response and legacy array response (for cache compatibility)
      let vehiclesData: any[] = [];
      let total = 0;
      
      if (response.data) {
        // Check if it's paginated response (new format)
        if (response.data.vehicles && Array.isArray(response.data.vehicles)) {
          vehiclesData = response.data.vehicles;
          total = response.data.total || 0;
        } 
        // Check if it's legacy array response (old cached format)
        else if (Array.isArray(response.data)) {
          vehiclesData = response.data;
          // For legacy format, we can't know total, so estimate based on current page
          // If we got full page, there might be more
          total = vehiclesData.length < ITEMS_PER_PAGE 
            ? (page - 1) * ITEMS_PER_PAGE + vehiclesData.length
            : page * ITEMS_PER_PAGE + 1; // Estimate - there might be more
        }
      }
      
      // If no vehicles found, log for debugging
      if (vehiclesData.length === 0 && !loading) {
        console.warn('No vehicles found. Response:', response.data);
      }
      
      // Transform backend response to match expected format
      const results = vehiclesData.map((vehicle: any) => ({
        id: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        brand: vehicle.brand,
        pricePerDay: vehicle.price_per_day,
        location: vehicle.address,
        address: vehicle.address,
        city: vehicle.city,
        district: vehicle.district,
        coordinates: [vehicle.lat, vehicle.lng] as [number, number],
        images: vehicle.images || [],
        rating: vehicle.rating,
        verified: vehicle.verified,
        distance: 0,
        owner: {
          name: vehicle.owner?.name || 'Unknown',
          avatar: vehicle.owner?.avatar || '',
          rating: vehicle.owner?.rating || 0,
        },
      }));
      setVehicles(results);
      
      // ALGORITHM: Use total count from backend (accurate, not estimated)
      setTotalVehicles(total);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
      setTotalVehicles(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: SearchParams) => {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.vehicleType) params.set('type', filters.vehicleType);
    if (filters.startDate) params.set('start', filters.startDate);
    if (filters.endDate) params.set('end', filters.endDate);
    
    setSearchParams(params);
  };

  const handleVehicleClick = (id: string) => {
    // Preserve search params (start, end, city) when navigating to vehicle details
    const params = new URLSearchParams();
    if (currentFilters.startDate) params.set('start', currentFilters.startDate);
    if (currentFilters.endDate) params.set('end', currentFilters.endDate);
    if (currentFilters.city) params.set('city', currentFilters.city);
    
    const queryString = params.toString();
    navigate(`/vehicle/${id}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Search Filters - Sticky */}
      <div className="sticky top-20 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg transition-colors">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-6">
          <SearchBar 
            variant="compact" 
            onSearch={handleSearch}
            initialValues={currentFilters}
          />
        </div>
      </div>

      {/* Split Layout: Results + Map */}
      <div className="max-w-[1920px] mx-auto">
        {/* Check if has search filters (city or vehicleType) */}
        {currentFilters.city || currentFilters.vehicleType ? (
          // After search: 2 columns + map with optimized spacing
          <div className="lg:grid lg:grid-cols-[1fr_550px] xl:grid-cols-[1fr_700px] 2xl:grid-cols-[1fr_800px]">
            {/* Left: Results */}
            <div className="px-6 lg:px-12 lg:pr-9 xl:px-20 xl:pr-12 py-12">
              {/* Results Header */}
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                  Available Vehicles
                </h1>
                <p className="text-gray-500 dark:text-gray-400 transition-colors">
                  {loading ? 'Searching...' : `${vehicles.length} vehicles available`}
                  {currentFilters.city && ` in ${currentFilters.city}`}
                </p>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {[...Array(6)].map((_, index) => (
                    <VehicleCardSkeleton key={index} layout="grid" />
                  ))}
                </div>
              ) : vehicles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {vehicles
                      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                      .map((vehicle) => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onClick={() => handleVehicleClick(vehicle.id)}
                          layout="grid"
                          isSaved={isFavorited(vehicle.id)}
                          onToggleSave={() => toggleFavorite(vehicle.id, 'vehicle')}
                        />
                      ))}
                  </div>

                  {/* Pagination */}
                  {vehicles.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.ceil(vehicles.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              page === currentPage
                                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg'
                                : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(vehicles.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage >= Math.ceil(vehicles.length / ITEMS_PER_PAGE)}
                        className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="max-w-md mx-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-12 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                      {t('search.noResults')}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors">
                      Try adjusting your filters or search in a different location
                    </p>
                    <button
                      onClick={() => setSearchParams(new URLSearchParams())}
                      className="px-8 py-3 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
                    >
                      CLEAR FILTERS
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Map - Show when has results and filters */}
            {vehicles.length > 0 && (
              <div className="hidden lg:block sticky top-36 h-[calc(100vh-9rem)] pl-6 pr-6 lg:pr-8 xl:pr-12">
                <div className="h-full rounded-3xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 shadow-2xl bg-white dark:bg-gray-800 transition-all">
                  {/* Map Header */}
                  <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white/98 to-white/95 dark:from-gray-800/98 dark:to-gray-800/95 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/60 px-6 py-4 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-gray-100 flex items-center justify-center shadow-md">
                          <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                            Map View
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} nearby
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-bold tracking-wide shadow-lg">
                        {currentFilters.city || 'ALL AREAS'}
                      </div>
                    </div>
                  </div>

                  {/* Map Component */}
                  <div className="pt-[72px] h-full">
                    <Map 
                      vehicles={vehicles.map(v => ({
                        id: v.id,
                        name: v.name,
                        address: v.address || v.location,
                        coordinates: v.coordinates || [10.8231, 106.6297],
                        pricePerDay: v.pricePerDay,
                        image: v.images[0],
                      }))}
                      center={
                        currentFilters.city 
                          ? getCityCoordinates(currentFilters.city)
                          : (vehicles.length > 0 && vehicles[0].coordinates 
                              ? vehicles[0].coordinates 
                              : [10.8231, 106.6297])
                      }
                      zoom={currentFilters.city ? 12 : 11}
                      height="100%"
                      onMarkerClick={handleVehicleClick}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Before search: 4 columns, no map, full width
          <div className="px-6 lg:px-12 xl:px-20 py-12">
            {/* Results Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                Featured Vehicles
              </h1>
              <p className="text-gray-500 dark:text-gray-400 transition-colors">
                {loading ? 'Loading...' : `${totalVehicles} vehicles available`}
              </p>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {[...Array(12)].map((_, index) => (
                  <VehicleCardSkeleton key={index} layout="grid" />
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {/* ALGORITHM: No need to slice - backend already returns only current page items */}
                    {vehicles.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onClick={() => handleVehicleClick(vehicle.id)}
                        layout="grid"
                        isSaved={isFavorited(vehicle.id)}
                        onToggleSave={() => toggleFavorite(vehicle.id, 'vehicle')}
                      />
                    ))}
                </div>

                {/* Pagination */}
                {totalVehicles > ITEMS_PER_PAGE && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {/* ALGORITHM: Use totalVehicles from backend for accurate pagination */}
                      {Array.from({ length: Math.ceil(totalVehicles / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            page === currentPage
                              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg'
                              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalVehicles / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(totalVehicles / ITEMS_PER_PAGE)}
                      className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-12 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                    No vehicles found
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 transition-colors">
                    Try adjusting your filters or search in a different location
                  </p>
                  <button
                    onClick={() => setSearchParams(new URLSearchParams())}
                    className="px-8 py-3 text-sm font-medium tracking-widest text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-lg hover:shadow-2xl"
                  >
                    CLEAR FILTERS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
