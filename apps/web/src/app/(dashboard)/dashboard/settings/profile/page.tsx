import { headers }      from 'next/headers';
import { getSettingsT } from '../_i18n';

export default async function ProfileSettingsPage() {
  const hdrs = await headers();
  const t    = getSettingsT(hdrs.get('x-locale') ?? 'pt');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t.profilePage.title}</h1>
        <p className="text-sm text-stone-400 mt-1">{t.profilePage.description}</p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 text-center">
        <p className="text-sm text-stone-400">{t.profilePage.comingSoon}</p>
      </div>
    </div>
  );
}
