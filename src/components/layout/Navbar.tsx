import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Moon, Sun, User, LogOut, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import NotificationBell from '../common/NotificationBell';
import LanguageSwitcher from '../common/LanguageSwitcher';
import logoImage from '../../assets/img/golocal-logo.png';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useI18n();

  // Check if we're on homepage to determine transparent navbar
  const isHomepage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine navbar appearance based on scroll and page
  const isTransparent = isHomepage && !scrolled;
  const textColor = isTransparent ? 'text-white' : 'text-gray-900 dark:text-white';
  const showLogo = scrolled; // Show logo when scrolled
  const logoSize = scrolled ? 'h-12' : 'h-14'; // Larger logo sizes

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${isTransparent ? 'bg-black/20 backdrop-blur-md' : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50'}
        ${scrolled ? 'py-4' : 'py-6'}
      `}
    >
      <div className="max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          {/* Logo - Changes on Scroll */}
          <Link to="/" className="group flex items-center gap-3">
            {showLogo ? (
              // Show logo image when scrolled (with drop shadow to handle transparency)
              <img 
                src={logoImage} 
                alt="GoLocal" 
                className={`transition-all duration-500 ${logoSize} drop-shadow-lg hover:scale-110`}
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }}
              />
            ) : (
              // Show text + logo when not scrolled
              <div className="flex items-center gap-3">
                <img 
                  src={logoImage} 
                  alt="GoLocal" 
                  className={`transition-all duration-500 ${logoSize} drop-shadow-2xl`}
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
                />
                <span 
                  className={`
                    font-bold tracking-tight transition-all duration-500
                    ${textColor} text-3xl drop-shadow-lg
                    hover:opacity-70
                  `}
                >
                  GoLocal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation - Always Visible */}
          <div className="hidden lg:flex items-center gap-12">
            <Link 
              to="/search" 
              className={`
                text-sm font-medium tracking-wide transition-all duration-300
                ${textColor} hover:opacity-70
              `}
            >
              {t('navbar.findCars')}
            </Link>
            <Link 
              to="/places" 
              className={`
                text-sm font-medium tracking-wide transition-all duration-300
                ${textColor} hover:opacity-70
              `}
            >
              {t('navbar.destinations')}
            </Link>
            <Link 
              to="/become-owner" 
              className={`
                text-sm font-medium tracking-wide transition-all duration-300
                ${textColor} hover:opacity-70
              `}
            >
              {t('navbar.hostYourVehicle')}
            </Link>
          </div>

          {/* Right Actions - Minimal */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Night Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                p-2 transition-all duration-300
                ${textColor} hover:opacity-70
              `}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated && <NotificationBell />}

            <Link 
              to="/cart"
              className={`
                p-2 transition-all duration-300
                ${textColor} hover:opacity-70
              `}
              aria-label="Shopping cart"
            >
              <ShoppingCart size={20} />
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button 
                  className={`
                    flex items-center gap-2 text-sm font-medium tracking-wide transition-all duration-300
                    ${textColor} hover:opacity-70
                  `}
                >
                  <User size={18} />
                  <span>{user?.name?.split(' ')[0] || t('navbar.account')}</span>
                </button>
                
                <div className="absolute right-0 mt-6 w-52 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/50 dark:border-gray-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="px-6 py-3 border-b border-gray-100/50 dark:border-gray-700/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors">
                    {t('navbar.profile')}
                  </Link>
                  {(user?.role === 'driver' || user?.role === 'admin') && (
                    <Link to="/booking-approval" className="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors">
                      {t('navbar.bookingRequests')}
                    </Link>
                  )}
                  <Link to="/messages" className="block px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-colors">
                    {t('navbar.messages')}
                  </Link>
                  {user?.role === 'admin' && (
                    <>
                      <hr className="my-2 border-gray-100/50 dark:border-gray-700/50" />
                      <Link to="/admin" className="block px-6 py-3 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2">
                        <Shield size={16} />
                        {t('navbar.adminDashboard')}
                      </Link>
                    </>
                  )}
                  <hr className="my-2 border-gray-100/50 dark:border-gray-700/50" />
                  <button 
                    onClick={logout}
                    className="w-full text-left px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 rounded-b-2xl"
                  >
                    <LogOut size={16} />
                    {t('navbar.signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  to="/login"
                  className={`
                    text-sm font-medium tracking-wide transition-all duration-300
                    ${textColor} hover:opacity-70
                  `}
                >
                  {t('navbar.logIn')}
                </Link>
                <Link
                  to="/signup"
                  className={`
                    px-6 py-2 text-sm font-medium tracking-wide transition-all duration-300 rounded-xl shadow-md hover:shadow-lg
                    ${isTransparent 
                      ? 'bg-white text-gray-900 hover:bg-gray-100' 
                      : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                    }
                  `}
                >
                  {t('navbar.signUp')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`
              lg:hidden text-sm font-medium tracking-wide
              ${textColor}
            `}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? t('navbar.close') : t('navbar.menu')}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-6 pb-6 border-t border-white/20 pt-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language:</span>
                <LanguageSwitcher />
              </div>
              <Link to="/search" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                {t('navbar.findCars')}
              </Link>
              <Link to="/places" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                {t('navbar.destinations')}
              </Link>
              <Link to="/become-owner" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                {t('navbar.hostYourVehicle')}
              </Link>
              <Link to="/cart" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                {t('navbar.cart')}
              </Link>
              
              <hr className="border-gray-200/50 dark:border-gray-700/50" />
              
              {isAuthenticated ? (
                <div className="flex flex-col gap-4">
                  <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                    {t('navbar.profile').toUpperCase()}
                  </Link>
                  {(user?.role === 'driver' || user?.role === 'admin') && (
                    <Link to="/booking-approval" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                      {t('navbar.bookingRequests').toUpperCase()}
                    </Link>
                  )}
                  <Link to="/messages" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                    {t('navbar.messages').toUpperCase()}
                  </Link>
                  <Link to="/cart" className="text-sm font-medium tracking-wide text-gray-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                    {t('navbar.myTrips')}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-medium tracking-wide text-purple-600 dark:text-purple-400 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <Shield size={16} />
                      {t('navbar.adminDashboard').toUpperCase()}
                    </Link>
                  )}
                  <button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="text-sm font-medium tracking-wide text-red-600 dark:text-red-400 text-left"
                  >
                    {t('navbar.signOut').toUpperCase()}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link 
                    to="/login"
                    className="text-sm font-medium tracking-wide text-gray-900 dark:text-white text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navbar.logIn')}
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 text-sm font-medium tracking-wide hover:bg-gray-800 dark:hover:bg-gray-200 transition-all rounded-xl shadow-md hover:shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('navbar.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
