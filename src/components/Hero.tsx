import type { SearchParams } from './SearchBar';
import SearchBar from './SearchBar';

type HeroProps = {
  onSearch: (params: SearchParams) => void;
  backgroundImage?: string;
  title?: string;
  subtitle?: string;
};

export default function Hero({ 
  onSearch, 
  backgroundImage = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&h=1080&fit=crop',
  title = 'Discover Vietnam',
  subtitle = 'Over 1,000 quality vehicles ready for every journey'
}: HeroProps) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Hero Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-lg md:text-2xl text-black/50 mb-12 font-normal tracking-wide max-w-2xl background-blur-sm">
          {subtitle}
        </p>

        {/* Search Bar */}
        <SearchBar onSearch={onSearch} variant="hero" />

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
