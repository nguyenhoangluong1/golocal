import { useState, useEffect } from 'react';

interface Slide {
  image: string;
  title: string;
  subtitle?: string;
}

interface SlideshowProps {
  slides: Slide[];
  autoPlayInterval?: number; // milliseconds
  height?: string;
}

export default function Slideshow({ 
  slides, 
  autoPlayInterval = 5000,
  height = 'h-[60vh]'
}: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [currentIndex, autoPlayInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className={`relative w-full ${height} overflow-hidden bg-black`}>
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`
              absolute inset-0 w-full h-full transition-opacity duration-1000
              ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="relative z-20 h-full flex items-end pb-16 md:pb-24">
              <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl">
                    {slide.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 text-white hover:text-white/70 transition-colors"
        aria-label="Previous slide"
      >
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 text-white hover:text-white/70 transition-colors"
        aria-label="Next slide"
      >
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              w-2 h-2 transition-all duration-300
              ${index === currentIndex 
                ? 'bg-white w-12' 
                : 'bg-white/40 hover:bg-white/60'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
