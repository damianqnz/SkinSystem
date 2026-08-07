import 'server-only';

import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { db }                          from '@/infrastructure/db';
import { organizations }               from '@/infrastructure/db/schema/organizations';
import {
  organizationPhones,
  organizationGallery,
}                                      from '@/infrastructure/db/schema/settings';
import { googleReviews }               from '@/infrastructure/db/schema/notifications';
import { availabilityRules }           from '@/infrastructure/db/schema/calendar';
import { getCategoriesWithServices }   from '@/domains/catalog/service';
import type { CategoryWithServices }   from '@/domains/catalog/service';

// ── Types ─────────────────────────────────────────────────────

export type OrgPhone       = { phone: string; label: string | null; isPrimary: boolean };
export type GalleryImage   = { id: string; url: string; altText: string | null; sortOrder: number };
export type Review         = {
  id: string; reviewerName: string | null; reviewerPhotoUrl: string | null;
  rating: number; comment: string | null; publishedAt: Date; isHighlighted: boolean;
};
export type AvailabilityDay = { dayOfWeek: number; isActive: boolean; openTime: string; closeTime: string };
export type OpenStatus      = { isOpen: boolean; label: string; opensAt: string | null };

export type PublicOrg = {
  id: string; name: string; slug: string; locale: string; timezone: string;
  logoUrl: string | null; bannerUrl: string | null; about: string | null;
  address: string | null; city: string | null; postalCode: string | null;
  country: string | null; primaryEmail: string | null;
  socialLinks: Record<string, string>;
  themeConfig: Record<string, string>;
};

export type LandingData = {
  org:          PublicOrg;
  phones:       OrgPhone[];
  gallery:      GalleryImage[];
  reviews:      Review[];
  availability: AvailabilityDay[];
  openStatus:   OpenStatus;
  avgRating:    number;
  reviewCount:  number;
  categories:   CategoryWithServices[];
};

// ── Helpers ───────────────────────────────────────────────────

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const GALLERY_BUCKET = 'org-gallery';

function storageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${GALLERY_BUCKET}/${path}`;
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

const DAY_NAMES_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function computeOpenStatus(rules: AvailabilityDay[], timezone: string): OpenStatus {
  const now   = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, weekday: 'long',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);

  const DOW_MAP: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  const weekday      = parts.find(p => p.type === 'weekday')?.value ?? 'Monday';
  const todayDow     = DOW_MAP[weekday] ?? 1;
  const hour         = parseInt(parts.find(p => p.type === 'hour')?.value   ?? '0', 10);
  const minute       = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  const nowMinutes   = hour * 60 + minute;

  const todayRule = rules.find(r => r.dayOfWeek === todayDow && r.isActive) ?? null;

  if (!todayRule) {
    // Find next open day
    for (let delta = 1; delta <= 7; delta++) {
      const nextDow  = (todayDow + delta) % 7;
      const nextRule = rules.find(r => r.dayOfWeek === nextDow && r.isActive);
      if (nextRule) {
        const dayName = DAY_NAMES_PT[nextDow] ?? '';
        return { isOpen: false, label: `Fechado · Abre ${dayName} às ${fmtTime(nextRule.openTime)}`, opensAt: nextRule.openTime };
      }
    }
    return { isOpen: false, label: 'Fechado', opensAt: null };
  }

  const [openH = 0, openM = 0]   = todayRule.openTime.split(':').map(Number);
  const [closeH = 0, closeM = 0] = todayRule.closeTime.split(':').map(Number);
  const openMins                 = openH * 60 + openM;
  const closeMins                = closeH * 60 + closeM;

  if (nowMinutes >= openMins && nowMinutes < closeMins) {
    return { isOpen: true, label: 'Aberto', opensAt: null };
  }

  if (nowMinutes < openMins) {
    return { isOpen: false, label: `Fechado · Abre às ${fmtTime(todayRule.openTime)}`, opensAt: todayRule.openTime };
  }

  // Closed for the day — find tomorrow
  for (let delta = 1; delta <= 7; delta++) {
    const nextDow  = (todayDow + delta) % 7;
    const nextRule = rules.find(r => r.dayOfWeek === nextDow && r.isActive);
    if (nextRule) {
      const dayName = DAY_NAMES_PT[nextDow] ?? '';
      return { isOpen: false, label: `Fechado · Abre ${dayName} às ${fmtTime(nextRule.openTime)}`, opensAt: nextRule.openTime };
    }
  }
  return { isOpen: false, label: 'Fechado', opensAt: null };
}

// ── Main loader ───────────────────────────────────────────────

export async function getLandingData(slug: string): Promise<LandingData | null> {
  const orgRows = await db
    .select({
      id: organizations.id, name: organizations.name,
      slug: organizations.slug, locale: organizations.locale,
      timezone: organizations.timezone, logoUrl: organizations.logoUrl,
      bannerUrl: organizations.bannerUrl, about: organizations.about,
      address: organizations.address, city: organizations.city,
      postalCode: organizations.postalCode, country: organizations.country,
      primaryEmail: organizations.primaryEmail, socialLinks: organizations.socialLinks,
      themeConfig: organizations.themeConfig,
    })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!orgRows[0]) return null;
  const rawOrg = orgRows[0];
  const org: PublicOrg = {
    ...rawOrg,
    socialLinks:  (rawOrg.socialLinks  ?? {}) as Record<string, string>,
    themeConfig:  (rawOrg.themeConfig  ?? {}) as Record<string, string>,
  };

  const [phonesRows, galleryRows, reviewsRows, rulesRows, catalogResult] = await Promise.all([
    db.select({ phone: organizationPhones.phone, label: organizationPhones.label, isPrimary: organizationPhones.isPrimary })
      .from(organizationPhones)
      .where(eq(organizationPhones.organizationId, org.id))
      .orderBy(desc(organizationPhones.isPrimary)),

    db.select({ id: organizationGallery.id, storagePath: organizationGallery.storagePath, altText: organizationGallery.altText, sortOrder: organizationGallery.sortOrder })
      .from(organizationGallery)
      .where(and(eq(organizationGallery.organizationId, org.id), eq(organizationGallery.isActive, true)))
      .orderBy(asc(organizationGallery.sortOrder)),

    db.select({
      id: googleReviews.id, reviewerName: googleReviews.reviewerName,
      reviewerPhotoUrl: googleReviews.reviewerPhotoUrl, rating: googleReviews.rating,
      comment: googleReviews.comment, publishedAt: googleReviews.publishedAt,
      isHighlighted: googleReviews.isHighlighted,
    })
      .from(googleReviews)
      .where(eq(googleReviews.organizationId, org.id))
      .orderBy(desc(googleReviews.isHighlighted), desc(googleReviews.publishedAt))
      .limit(20),

    db.select({
      dayOfWeek: availabilityRules.dayOfWeek, isActive: availabilityRules.isActive,
      openTime: availabilityRules.openTime, closeTime: availabilityRules.closeTime,
    })
      .from(availabilityRules)
      .where(and(eq(availabilityRules.organizationId, org.id), isNull(availabilityRules.profileId)))
      .orderBy(asc(availabilityRules.dayOfWeek)),

    getCategoriesWithServices(org.id),
  ]);

  const reviews    = reviewsRows as Review[];
  const total      = reviews.reduce((s, r) => s + r.rating, 0);
  const avgRating  = reviews.length > 0 ? Math.round((total / reviews.length) * 10) / 10 : 0;
  const availability = rulesRows as AvailabilityDay[];

  return {
    org,
    phones:    phonesRows,
    gallery:   galleryRows.map(r => ({ id: r.id, url: storageUrl(r.storagePath), altText: r.altText, sortOrder: r.sortOrder })),
    reviews,
    availability,
    openStatus: computeOpenStatus(availability, org.timezone),
    avgRating,
    reviewCount: reviews.length,
    categories: catalogResult.data?.categories ?? [],
  };
}
