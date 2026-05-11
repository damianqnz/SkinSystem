import en from './messages/en.json';

// next-intl type augmentation: infer all translation keys from en.json (source of truth).
// Every key that exists in en.json will be type-checked by useTranslations / getTranslations.
declare global {
  type IntlMessages = typeof en;
}
