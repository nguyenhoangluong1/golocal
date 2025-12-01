import type { FormEvent, ChangeEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import { MapPin, Car, ChevronDown } from 'lucide-react';

export type SearchParams = {
  city: string;
  vehicleType: string;
  startDate: string;
  endDate: string;
};

type SearchBarProps = {
  onSearch: (params: SearchParams) => void;
  variant?: 'hero' | 'compact';
  initialValues?: Partial<SearchParams>;
};

const CITIES = [
  'Hanoi',
  'Ho Chi Minh City',
  'Da Nang',
  'Hoi An',
  'Nha Trang',
  'Dalat',
  'Hue',
  'Phu Quoc',
  'Sapa',
  'Ha Long',
];

const VEHICLE_TYPES = [
  { value: 'MOTORBIKE', label: 'Motorbike' },
  { value: 'CAR', label: 'Car' },
  { value: 'BICYCLE', label: 'Bicycle' },
];

export default function SearchBar({ onSearch, variant = 'hero', initialValues }: SearchBarProps) {
  const [params, setParams] = useState<SearchParams>({
    city: initialValues?.city ?? '',
    vehicleType: initialValues?.vehicleType ?? '',
    startDate: initialValues?.startDate ?? '',
    endDate: initialValues?.endDate ?? '',
  });

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const vehicleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) {
        setShowVehicleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(params);
  };

  const handleChange = (field: keyof SearchParams) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setParams((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCitySelect = (city: string) => {
    setParams((prev) => ({ ...prev, city }));
    setShowCityDropdown(false);
  };

  const handleVehicleSelect = (vehicleType: string) => {
    setParams((prev) => ({ ...prev, vehicleType }));
    setShowVehicleDropdown(false);
  };

  const isHero = variant === 'hero';
  const today = new Date().toISOString().split('T')[0];

  const getCityLabel = () => {
    return params.city || 'Select your city';
  };

  const getVehicleLabel = () => {
    const vehicle = VEHICLE_TYPES.find(v => v.value === params.vehicleType);
    return vehicle ? vehicle.label : 'All types';
  };

  if (isHero) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl border border-white/20">
          <input
            type="text"
            placeholder="Enter your city"
            value={params.city}
            onChange={handleChange('city')}
            list="cities"
            className="flex-1 px-8 py-5 text-lg text-gray-900 dark:text-white bg-transparent focus:outline-none font-light border-b sm:border-b-0 sm:border-r border-gray-200/50 dark:border-gray-700/50 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <datalist id="cities">
            {CITIES.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          <button
            type="submit"
            className="px-12 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium tracking-widest hover:bg-gray-800 dark:hover:bg-gray-100 transition-all rounded-r-2xl sm:rounded-r-2xl sm:rounded-l-none"
          >
            SEARCH
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-colors rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Location Dropdown */}
        <div className="relative" ref={cityDropdownRef}>
          <label className="block text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 mb-3 transition-colors">
            Location
          </label>
          <button
            type="button"
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 dark:text-white bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 transition rounded-xl flex items-center justify-between hover:bg-white/80 dark:hover:bg-gray-700/80"
          >
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-gray-400 dark:text-gray-500" />
              <span className={params.city ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                {getCityLabel()}
              </span>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Custom Dropdown */}
          {showCityDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
              <div 
                onClick={() => handleCitySelect('')}
                className="px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer transition-colors border-b border-gray-100/50 dark:border-gray-700/50"
              >
                <span className="text-gray-500 dark:text-gray-400 text-sm">All cities</span>
              </div>
              {CITIES.map((city) => (
                <div
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={`px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer transition-colors flex items-center gap-3 ${
                    params.city === city ? 'bg-gray-100/50 dark:bg-gray-700/50' : ''
                  }`}
                >
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{city}</span>
                  {params.city === city && (
                    <svg className="ml-auto w-5 h-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Type Dropdown */}
        <div className="relative" ref={vehicleDropdownRef}>
          <label className="block text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 mb-3 transition-colors">
            Vehicle type
          </label>
          <button
            type="button"
            onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
            className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 dark:text-white bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 transition rounded-xl flex items-center justify-between hover:bg-white/80 dark:hover:bg-gray-700/80"
          >
            <div className="flex items-center gap-3">
              <Car size={18} className="text-gray-400 dark:text-gray-500" />
              <span className={params.vehicleType ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                {getVehicleLabel()}
              </span>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Custom Dropdown */}
          {showVehicleDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl">
              <div 
                onClick={() => handleVehicleSelect('')}
                className="px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer transition-colors border-b border-gray-100/50 dark:border-gray-700/50"
              >
                <span className="text-gray-500 dark:text-gray-400 text-sm">All types</span>
              </div>
              {VEHICLE_TYPES.map((type) => (
                <div
                  key={type.value}
                  onClick={() => handleVehicleSelect(type.value)}
                  className={`px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 cursor-pointer transition-colors flex items-center gap-3 ${
                    params.vehicleType === type.value ? 'bg-gray-100/50 dark:bg-gray-700/50' : ''
                  }`}
                >
                  <Car size={16} className="text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{type.label}</span>
                  {params.vehicleType === type.value && (
                    <svg className="ml-auto w-5 h-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 mb-3 transition-colors">
            Pickup date
          </label>
          <input
            type="date"
            value={params.startDate}
            onChange={handleChange('startDate')}
            min={today}
            className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 dark:text-white bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 transition rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400 mb-3 transition-colors">
            Return date
          </label>
          <input
            type="date"
            value={params.endDate}
            onChange={handleChange('endDate')}
            min={params.startDate || today}
            className="w-full px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 dark:text-white bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 transition rounded-xl"
          />
        </div>

        <button
          type="submit"
          className="w-full px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-md hover:shadow-lg"
        >
          APPLY FILTERS
        </button>
      </div>
    </form>
  );
}
