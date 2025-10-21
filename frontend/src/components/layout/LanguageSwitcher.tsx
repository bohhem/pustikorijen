import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'bs', name: 'Bosanski', flag: '🇧🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1 sm:gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              i18n.language === lang.code
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={lang.name}
          >
            <span className="hidden sm:inline mr-1">{lang.flag}</span>
            <span className="sm:hidden text-base">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
