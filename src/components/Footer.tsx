import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

// Scroll to top when clicking footer links
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const navigationLinks = [
  { label: 'Search vehicles', to: '/search' },
  { label: 'Explore destinations', to: '/places' },
  { label: 'Become a host', to: '/become-owner' },
  { label: 'How it works', to: '/how-it-works' },
];

const supportLinks = [
  { label: 'Help center', to: '/support' },
  { label: 'Safety standards', to: '/safety' },
  { label: 'Insurance partners', to: '/insurance' },
  { label: 'Community guidelines', to: '/community' },
];

const policyItems = ['Terms', 'Privacy', 'Cookies', 'Sitemap'];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <footer className="bg-gray-950 dark:bg-gray-950 text-white transition-colors">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-24">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-3xl font-bold tracking-tight">GoLocal</p>
            <p className="mt-6 text-sm text-gray-400 dark:text-gray-400 leading-relaxed max-w-md transition-colors">
              GoLocal is the modern peer-to-peer marketplace for vehicle rentals across Vietnam. Discover curated rides, premium service, and a seamless booking experience inspired by luxury travel brands.
            </p>
            <p className="mt-8 text-xs font-medium tracking-[0.3em] text-gray-500 dark:text-gray-500 uppercase transition-colors">
              Launch updates
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex gap-3 max-w-md">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white/40 focus:outline-none transition"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 text-xs font-semibold tracking-[0.3em] uppercase bg-white text-gray-900 hover:bg-gray-200 transition"
              >
                Notify me
              </button>
            </form>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gray-500 uppercase">Navigation</p>
            <ul className="mt-6 space-y-4">
              {navigationLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={scrollToTop}
                    className="text-sm font-normal text-gray-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gray-500 uppercase">Support</p>
            <ul className="mt-6 space-y-4">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={scrollToTop}
                    className="text-sm font-normal text-gray-300 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gray-500 uppercase">Contact</p>
            <div className="mt-6 space-y-4 text-sm text-gray-300">
              <p>Headquarters: 36 Le Loi, District 1, Ho Chi Minh City</p>
              <p>Phone: +84 353 906 610</p>
              <p>Email: nghoangluong28092004@gmail.com</p>
              <p>Support: support@golocal.vn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <p className="text-sm text-gray-500">
                © {currentYear} GoLocal. Crafted in Vietnam for modern explorers.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {policyItems.map((item) => (
                  <span key={item} className="hover:text-white transition-colors cursor-pointer">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/nguyenhoangluong1"
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              
              <a 
                href="https://x.com/hoangluonguyen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              
              <a 
                href="https://www.linkedin.com/in/hoang-luong-nguyen-78223538b/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              
              <a 
                href="https://www.youtube.com/@nhluong2809" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
