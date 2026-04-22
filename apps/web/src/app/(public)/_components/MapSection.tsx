import { MapPin } from 'lucide-react';
import type { PublicOrg } from '../_data/getLandingData';

interface Props {
  org: PublicOrg;
}

export function MapSection({ org }: Props) {
  const address = [org.address, org.city, org.postalCode, org.country]
    .filter(Boolean)
    .join(', ');

  if (!address) return null;

  const mapsQuery = encodeURIComponent(address);

  return (
    <section id="morada" className="py-14 border-t border-stone-100 dark:border-stone-800">
      <div className="mb-8">
        <p className="text-[11px] font-outfit font-medium text-stone-400 uppercase tracking-[0.2em] mb-2">
          Onde estamos
        </p>
        <h2 className="font-cormorant text-4xl font-semibold text-stone-900 dark:text-stone-100">
          Morada
        </h2>
        <div className="mt-3 w-10 h-px bg-amber-400/60" />
      </div>

      {/* Address text */}
      <a
        href={`https://maps.google.com/?q=${mapsQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-start gap-2 mb-5 group"
      >
        <MapPin
          size={16}
          className="shrink-0 mt-0.5 text-amber-500 group-hover:text-amber-400 transition-colors"
        />
        <span className="font-outfit text-[14px] text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors underline underline-offset-2">
          {address}
        </span>
      </a>

      {/* Map embed */}
      <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800">
        <iframe
          title="Localização"
          src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15`}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
