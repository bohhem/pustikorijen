import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'bs',
    supportedLngs: ['en', 'bs', 'de'],
    preload: ['en', 'bs', 'de'],
    backend: {
      loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json'),
    },
    detection: {
      order: ['header'],
      lookupHeader: 'accept-language',
    },
  });

export default i18next;
