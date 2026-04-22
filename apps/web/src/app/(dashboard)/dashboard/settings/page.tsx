import { redirect } from 'next/navigation';

/**
 * /dashboard/settings → /dashboard/settings/brand
 * The layout handles the sub-sidebar; we just redirect to the default section.
 */
export default function SettingsIndexPage() {
  redirect('/dashboard/settings/brand');
}
