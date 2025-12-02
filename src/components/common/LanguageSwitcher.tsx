import { Globe } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="
        flex items-center gap-2 px-3 py-2 rounded-lg
        text-sm font-medium transition-all duration-300
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300
      "
      aria-label="Toggle language"
      title={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
    >
      <Globe size={16} />
      <span className="uppercase">{language === 'en' ? 'EN' : 'VI'}</span>
    </button>
  );
}

