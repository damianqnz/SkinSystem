/**
 * @file _i18n/en.ts
 * @description English labels for the consumer booking funnel.
 *              Fallback for any non-ES, non-PT browser locale.
 */

import type { BookingLabels } from './types';

export const en: BookingLabels = {
  header: {
    title: 'Online Booking',
    back:  'Back to home',
  },
  steps: {
    service:  'Service',
    calendar: 'Time',
    auth:     'Sign in',
    confirm:  'Confirm',
  },
  common: {
    back:    'Back',
    minutes: 'min',
  },
  service: {
    heading:      'Which treatment would you like?',
    empty:        'No services are available right now',
    select:       'Select →',
    fallbackName: 'Treatment',
    deposit:      'Deposit {percent}% · {amount} now',
  },
  calendar: {
    heading: 'Choose a date and time',
    empty:   'No times available',
    monthNames: [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ],
    dayHeaders: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },
  auth: {
    headingOptions:         'Sign in to book',
    subtitleOptions:        'Sign in or create an account to continue',
    google:                 'Continue with Google',
    email:                  'Continue with Email',
    createProfile:          'Create profile',
    continueGuest:          'Continue as guest',
    or:                     'or',
    headingLogin:           'Sign in',
    subtitleLogin:          'Access your account to book',
    headingRegister:        'Create profile',
    subtitleRegister:       'Create your account to manage your appointments',
    back:                   '← Back',
    emailLabel:             'Email',
    passwordLabel:          'Password',
    fullNameLabel:          'Full name',
    emailPlaceholder:       'anna@email.com',
    passwordPlaceholder:    '••••••••',
    passwordMinPlaceholder: 'Min. 6 characters',
    fullNamePlaceholder:    'Anna Smith',
    enter:                  'Sign in',
    createAccount:          'Create account',
    noAccount:              "Don't have an account?",
    createNow:              'Create profile',
    errorCredentials:       'Invalid email or password',
  },
  confirm: {
    heading:            'Confirm your booking',
    dateTime:           'Date and time',
    reservedAs:         'Booked as',
    policyFallback:     'By booking you accept the cancellation policy.',
    stripeSecure:       'Secure payment with Stripe',
    payButton:          'Pay {amount}',
    bookButton:         'Confirm booking',
    payButtonGuest:     'Pay {amount} →',
    bookButtonGuest:    'Confirm booking →',
    redirecting:        'Redirecting to payment…',
    nameLabel:          'Full name',
    phoneLabel:         'Phone',
    emailLabel:         'Email',
    addressLabel:       'Address',
    noteLabel:          'Note (optional)',
    namePlaceholder:    'Anna Smith',
    phonePlaceholder:   '+1 555 000 0000',
    emailPlaceholder:   'anna@email.com',
    addressPlaceholder: 'Street, number, city',
    notePlaceholder:    'Allergies, preferences, relevant information...',
    emailHelp:          'You will receive the confirmation at this email.',
    acceptTerms:        'I accept the terms and conditions',
    viewPolicy:         'View policy',
    termsRequiredError: 'You must accept the terms to continue.',
    conflictError:      'This time slot was just booked. Please choose another.',
  },
  summary: {
    heading:           'Summary',
    subtotalOnline:    'Online subtotal',
    couponPlaceholder: 'Discount code',
    couponApply:       'Apply',
    totalNow:          'Total now',
    localBalance:      'Balance due on-site',
  },
  notices: {
    cancelledPayment: 'Your payment was cancelled. You can pick another time or try again.',
    oauthError:       'Google sign-in failed. Please try again or continue as a guest.',
  },
  metadata: {
    title: 'Book an appointment — {name}',
  },
};
