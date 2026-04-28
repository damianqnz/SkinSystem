/**
 * @file _i18n/types.ts
 * @description Shape of the booking funnel label dictionary.
 *              Single source of truth — all three locale files must match.
 */

export type BookingLocale = 'es' | 'pt' | 'en';

export interface BookingLabels {
  header: {
    title: string;
    back:  string;
  };
  steps: {
    service:  string;
    calendar: string;
    auth:     string;
    confirm:  string;
  };
  common: {
    back:     string;
    minutes:  string;
  };
  service: {
    heading:       string;
    empty:         string;
    select:        string;
    fallbackName:  string;
    deposit:       string; // {percent} {amount}
  };
  calendar: {
    heading:     string;
    empty:       string;
    monthNames:  readonly [string, string, string, string, string, string,
                           string, string, string, string, string, string];
    dayHeaders:  readonly [string, string, string, string, string, string, string]; // Sun…Sat
  };
  auth: {
    headingOptions:          string;
    subtitleOptions:         string;
    google:                  string;
    email:                   string;
    createProfile:           string;
    continueGuest:           string;
    or:                      string;
    headingLogin:            string;
    subtitleLogin:           string;
    headingRegister:         string;
    subtitleRegister:        string;
    back:                    string;
    emailLabel:              string;
    passwordLabel:           string;
    fullNameLabel:           string;
    emailPlaceholder:        string;
    passwordPlaceholder:     string;
    passwordMinPlaceholder:  string;
    fullNamePlaceholder:     string;
    enter:                   string;
    createAccount:           string;
    noAccount:               string;
    createNow:               string;
    errorCredentials:        string;
  };
  confirm: {
    heading:             string;
    dateTime:            string;
    reservedAs:          string;
    policyFallback:      string;
    stripeSecure:        string;
    payButton:           string; // {amount}
    bookButton:          string;
    payButtonGuest:      string; // {amount}
    bookButtonGuest:     string;
    redirecting:         string;
    nameLabel:           string;
    phoneLabel:          string;
    emailLabel:          string;
    addressLabel:        string;
    noteLabel:           string;
    namePlaceholder:     string;
    phonePlaceholder:    string;
    emailPlaceholder:    string;
    addressPlaceholder:  string;
    notePlaceholder:     string;
    emailHelp:           string;
    acceptTerms:         string;
    viewPolicy:          string;
    termsRequiredError:  string;
    conflictError:       string;
  };
  summary: {
    heading:            string;
    subtotalOnline:     string;
    couponPlaceholder:  string;
    couponApply:        string;
    totalNow:           string;
    localBalance:       string;
  };
  notices: {
    cancelledPayment:   string;
    oauthError:         string;
  };
  metadata: {
    title:              string; // {name}
  };
}
