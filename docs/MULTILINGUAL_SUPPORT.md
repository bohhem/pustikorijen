# Multilingual Support (i18n)

## Overview

Pustikorijen supports three languages:
- **Bosnian (bs)** - Default language
- **English (en)**
- **German (de)**

The application uses `i18next` for internationalization on both frontend and backend.

## Frontend Implementation

### Technology Stack
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Automatic language detection
- **i18next-http-backend**: Loading translations from backend (optional)

### Configuration

Location: `frontend/src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { /* translation files */ },
    fallbackLng: 'bs', // Default to Bosnian
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });
```

### Translation Files

All translations are stored in JSON files:

```
frontend/src/i18n/locales/
├── en/
│   └── translation.json
├── bs/
│   └── translation.json
└── de/
    └── translation.json
```

### Translation Structure

Translations are organized into logical namespaces:

```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "branches": "Branches"
  },
  "persons": { /* ... */ },
  "partnerships": { /* ... */ },
  "validation": { /* ... */ },
  "errors": { /* ... */ }
}
```

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('navigation.dashboard')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Language Switcher Component

Location: `frontend/src/components/layout/LanguageSwitcher.tsx`

The language switcher displays all available languages with flags:
- 🇧🇦 BS (Bosanski)
- 🇬🇧 EN (English)
- 🇩🇪 DE (Deutsch)

It's included in the main Layout component and persists the selection to localStorage.

## Backend Implementation

### Technology Stack
- **i18next**: Core i18n library
- **i18next-http-middleware**: Express middleware for language detection
- **i18next-fs-backend**: Load translations from file system

### Configuration

Location: `backend/src/i18n/config.ts`

```typescript
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'bs',
    supportedLngs: ['en', 'bs', 'de'],
    detection: {
      order: ['header'],
      lookupHeader: 'accept-language',
    },
  });
```

### Translation Files

```
backend/src/i18n/locales/
├── en/
│   └── translation.json
├── bs/
│   └── translation.json
└── de/
    └── translation.json
```

### Using Translations in Backend

```typescript
// In controllers or services
import i18n from '../i18n/config';

export function someController(req: Request, res: Response) {
  const lang = req.language || 'bs'; // Detected by middleware
  const message = i18n.t('errors.unauthorized', { lng: lang });

  res.status(401).json({ error: message });
}
```

## Adding New Translations

### 1. Add to Translation Files

Edit all three language files:
- `frontend/src/i18n/locales/en/translation.json`
- `frontend/src/i18n/locales/bs/translation.json`
- `frontend/src/i18n/locales/de/translation.json`

Example:
```json
{
  "newFeature": {
    "title": "New Feature Title",
    "description": "Description text"
  }
}
```

### 2. Use in Components

```tsx
<h1>{t('newFeature.title')}</h1>
<p>{t('newFeature.description')}</p>
```

### 3. With Parameters

Translation with placeholders:
```json
{
  "welcome": "Welcome, {{name}}!"
}
```

Usage:
```tsx
{t('welcome', { name: user.fullName })}
```

## Language Detection Priority

### Frontend
1. **localStorage** - Previously selected language
2. **Browser navigator** - Browser's preferred language

### Backend
1. **Accept-Language header** - HTTP header from request

## Testing Translations

1. **Switch Language**: Use the language switcher in the header
2. **Check localStorage**: Open browser DevTools → Application → Local Storage → `i18nextLng`
3. **Backend API**: Send requests with `Accept-Language` header:
   ```bash
   curl -H "Accept-Language: de" https://api-pustikorijen.vibengin.com/api/v1/health
   ```

## Current Translation Coverage

### Fully Translated Pages
- ✅ Login page
- ✅ Layout/Navigation
- ⚠️ Branches page (partially - needs full migration)
- ❌ Dashboard (not yet migrated)
- ❌ Person pages (not yet migrated)
- ❌ Partnership pages (not yet migrated)

### Translation Keys Available
- **common**: 13 keys (loading, save, delete, etc.)
- **auth**: 13 keys (login, register, validation)
- **navigation**: 5 keys (dashboard, branches, etc.)
- **branches**: 18 keys
- **persons**: 42 keys
- **personDetail**: 11 keys
- **partnerships**: 24 keys
- **tree**: 7 keys
- **validation**: 5 keys
- **errors**: 5 keys

**Total**: ~140+ translation keys per language

## Roadmap

### Phase 1 ✅ (Completed)
- [x] Install and configure i18n libraries
- [x] Create translation files for all 3 languages
- [x] Create language switcher component
- [x] Migrate Login page
- [x] Update Layout/Navigation

### Phase 2 (In Progress)
- [ ] Migrate Dashboard page
- [ ] Migrate Branches pages (list, detail, create)
- [ ] Migrate Person pages (list, detail, create, edit)
- [ ] Migrate Partnership pages
- [ ] Migrate Family Tree page

### Phase 3 (Future)
- [ ] Add date/time localization (using date-fns with locale)
- [ ] Add number formatting (currency, percentages)
- [ ] Implement backend email templates in multiple languages
- [ ] Add language preference to user profile
- [ ] RTL support (if needed for Arabic in future)

## Best Practices

1. **Always use translation keys** - Never hardcode user-facing text
2. **Organize by feature** - Group related translations together
3. **Keep keys descriptive** - Use `persons.firstName` not `p.fn`
4. **Provide context** - Add comments in JSON for complex translations
5. **Test all languages** - Don't just test the default language
6. **Use parameters** - Avoid string concatenation: `t('welcome', { name })`

## Troubleshooting

### Translations not showing
- Check that `i18n/config.ts` is imported in `main.tsx`
- Verify translation key exists in JSON file
- Check browser console for i18next errors
- Ensure JSON files are valid (no trailing commas)

### Language not persisting
- Check localStorage for `i18nextLng` key
- Verify LanguageDetector is configured correctly
- Clear browser cache and try again

### Backend translations not working
- Ensure i18n config is imported in index.ts
- Check that translation files exist in dist folder after build
- Verify Accept-Language header is being sent

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Best Practices](https://www.i18next.com/principles/fallback)
