import 'server-only';

/**
 * Booking-domain seeder — DEV/DEMO ONLY.
 *
 * Generates realistic mock data scoped to a single tenant:
 *   - 3 categories  (Facial, Capilar, Corporal)
 *   - 8 services    (distributed, real prices in cents)
 *   - 15 customers  (realistic PT/ES names)
 *   - 20 appointments
 *       · 2 today      (confirmed)
 *       · 3 tomorrow   (confirmed)
 *       · 15 within +10 days (mix pending/confirmed/cancelled)
 *
 * Every row is tagged with the `__SEED_TAG__` marker so `clearSeedData`
 * can wipe ONLY mock data without touching real tenant content.
 */

import { eq, and, gte, like, inArray } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customers } from '@/domains/customers/schema';
import { catalogCategories, catalogServices } from '@/domains/catalog/schema';
import { appointments } from './schema';
import type { AppointmentStatus } from './schema';
import type { Result } from '@/shared/types/result';

// ── Marker (every seeded row carries it for safe cleanup) ─────────
export const SEED_TAG = '__seed__';

const dbErr = (msg: string): Result<never> =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } });

// ── Static catalog blueprint ───────────────────────────────────────
const CATEGORIES = [
  { es: 'Facial',   pt: 'Facial',   en: 'Facial' },
  { es: 'Capilar',  pt: 'Capilar',  en: 'Hair'   },
  { es: 'Corporal', pt: 'Corporal', en: 'Body'   },
] as const;

type CategoryKey = 'facial' | 'capilar' | 'corporal';

const SERVICES: Array<{
  category: CategoryKey;
  name:     { es: string; pt: string; en: string };
  duration: number;
  cents:    number;
  color:    string;
}> = [
  { category: 'facial',   name: { es: 'Limpieza Profunda',     pt: 'Limpeza Profunda',          en: 'Deep Cleansing'        }, duration: 60, cents: 5500,  color: '#E8C9B8' },
  { category: 'facial',   name: { es: 'Hydrafacial',           pt: 'Hydrafacial',               en: 'Hydrafacial'           }, duration: 75, cents: 8500,  color: '#C9DCE5' },
  { category: 'facial',   name: { es: 'Tratamiento Antiedad',  pt: 'Tratamento Antienvelhecimento', en: 'Anti-aging'        }, duration: 90, cents: 12000, color: '#D4AF37' },
  { category: 'capilar',  name: { es: 'Mesoterapia Capilar',   pt: 'Mesoterapia Capilar',       en: 'Hair Mesotherapy'      }, duration: 60, cents: 9000,  color: '#B8A89C' },
  { category: 'capilar',  name: { es: 'Tratamiento Anticaída', pt: 'Tratamento Anti-queda',     en: 'Hair Loss Treatment'   }, duration: 45, cents: 7500,  color: '#A89C90' },
  { category: 'corporal', name: { es: 'Drenaje Linfático',     pt: 'Drenagem Linfática',        en: 'Lymphatic Drainage'    }, duration: 60, cents: 6000,  color: '#C5D5BC' },
  { category: 'corporal', name: { es: 'Radiofrecuencia',       pt: 'Radiofrequência',           en: 'Radiofrequency'        }, duration: 60, cents: 9500,  color: '#D5BCC5' },
  { category: 'corporal', name: { es: 'Presoterapia',          pt: 'Pressoterapia',             en: 'Pressotherapy'         }, duration: 45, cents: 4500,  color: '#BCC5D5' },
];

const CUSTOMER_NAMES = [
  'Sofia Coelho',          'Maria Lourdes Silva', 'Cheryl Hernández',
  'Micaela Faustino',      'Juliana Dias',        'Daniela Abreu',
  'Carla Prata',           'Andreia Gomes',       'Susana Franco',
  'Mariz Vera',            'Teresa Martins',      'Lucia Navarro',
  'Raquel Folques',        'Yolanda Mateus',      'Ana De Brito',
];

// ── Cleanup ────────────────────────────────────────────────────────

/**
 * Removes every row tagged as seed for the given tenant.
 * Order respects FK constraints: appointments → customers → services → categories.
 *
 * Tags used:
 *   - customers.notes = SEED_TAG
 *   - catalog_services.slug LIKE '__seed__%'
 *   - catalog_categories.sortOrder >= 9000  (reserved seed range)
 *   - appointments → those linked to seed customers (cleaned first)
 */
export async function clearSeedData(orgId: string): Promise<Result<{ removed: number }>> {
  try {
    let total = 0;

    // 1. Find seeded customers
    const seedCustomers = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.organizationId, orgId), eq(customers.notes, SEED_TAG)));
    const seedCustIds = seedCustomers.map(c => c.id);

    // 2. Delete appointments for those customers (no FK cascade exists)
    if (seedCustIds.length > 0) {
      const apptDel = await db.delete(appointments)
        .where(and(
          eq(appointments.organizationId, orgId),
          inArray(appointments.customerId, seedCustIds),
        ))
        .returning({ id: appointments.id });
      total += apptDel.length;
    }

    // 3. Delete customers
    const custDel = await db.delete(customers)
      .where(and(eq(customers.organizationId, orgId), eq(customers.notes, SEED_TAG)))
      .returning({ id: customers.id });
    total += custDel.length;

    // 4. Delete seeded services (any remaining appointments referencing them
    //    have already been removed in step 2).
    const svcDel = await db.delete(catalogServices)
      .where(and(
        eq(catalogServices.organizationId, orgId),
        like(catalogServices.slug, `${SEED_TAG}%`),
      ))
      .returning({ id: catalogServices.id });
    total += svcDel.length;

    // 5. Delete seeded categories (sortOrder >= 9000)
    const catDel = await db.delete(catalogCategories)
      .where(and(
        eq(catalogCategories.organizationId, orgId),
        gte(catalogCategories.sortOrder, 9000),
      ))
      .returning({ id: catalogCategories.id });
    total += catDel.length;

    return { data: { removed: total }, error: null };
  } catch {
    return dbErr('Failed to clear seed data');
  }
}

// ── Seeder ─────────────────────────────────────────────────────────

export async function seedTenantData(
  orgId: string,
  staffProfileId: string,
): Promise<Result<{ categories: number; services: number; customers: number; appointments: number }>> {
  try {
    // 1. Categories
    const catRows = await db.insert(catalogCategories).values(
      CATEGORIES.map((nameI18n, idx) => ({
        organizationId:  orgId,
        nameI18n,
        descriptionI18n: { es: SEED_TAG, pt: SEED_TAG, en: SEED_TAG },
        sortOrder:       9000 + idx,
        isActive:        true,
      })),
    ).returning({ id: catalogCategories.id });

    const facialCatId   = catRows[0]!.id;
    const capilarCatId  = catRows[1]!.id;
    const corporalCatId = catRows[2]!.id;

    const catLookup: Record<CategoryKey, string> = {
      facial:   facialCatId,
      capilar:  capilarCatId,
      corporal: corporalCatId,
    };

    // 2. Services
    const svcRows = await db.insert(catalogServices).values(
      SERVICES.map((s, idx) => ({
        organizationId:  orgId,
        categoryId:      catLookup[s.category],
        nameI18n:        s.name,
        descriptionI18n: {},
        durationMinutes: s.duration,
        priceCents:      s.cents,
        currency:        'EUR',
        depositPercent:  100,
        isActive:        true,
        sortOrder:       9000 + idx,
        color:           s.color,
        slug:            `${SEED_TAG}-${s.name.es.toLowerCase().replace(/\s+/g, '-')}`,
      })),
    ).returning({
      id:       catalogServices.id,
      duration: catalogServices.durationMinutes,
      cents:    catalogServices.priceCents,
    });

    // 3. Customers
    const custRows = await db.insert(customers).values(
      CUSTOMER_NAMES.map((fullName) => ({
        organizationId: orgId,
        fullName,
        email:          `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.pt`,
        phone:          `+351 9${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
        isGuest:        false,
        notes:          SEED_TAG,
      })),
    ).returning({ id: customers.id });

    // 4. Appointments
    const pickCustomer = () => custRows[Math.floor(Math.random() * custRows.length)]!.id;
    const pickService  = () => svcRows[Math.floor(Math.random() * svcRows.length)]!;

    const buildAppt = (
      daysFromToday: number,
      hour: number,
      status: AppointmentStatus,
    ) => {
      const start = new Date();
      start.setHours(hour, 0, 0, 0);
      start.setDate(start.getDate() + daysFromToday);
      const svc = pickService();
      const end = new Date(start.getTime() + svc.duration * 60_000);
      return {
        organizationId:   orgId,
        customerId:       pickCustomer(),
        serviceId:        svc.id,
        staffProfileId,
        startAt:          start,
        endAt:            end,
        status,
        priceCents:       svc.cents,
        discountCents:    0,
        surchargesCents:  0,
        totalCents:       svc.cents,
        policyAcceptedAt: new Date(),
      };
    };

    const apptInputs: Array<ReturnType<typeof buildAppt>> = [
      // Today (2 confirmed)
      buildAppt(0, 10, 'confirmed'),
      buildAppt(0, 14, 'confirmed'),
      // Tomorrow (3 confirmed)
      buildAppt(1, 9,  'confirmed'),
      buildAppt(1, 11, 'confirmed'),
      buildAppt(1, 16, 'confirmed'),
    ];

    // 15 distributed across +2 → +10 days, mixed status
    for (let i = 0; i < 15; i++) {
      const days   = 2 + Math.floor(Math.random() * 8);    // 2..9
      const hour   = 9 + Math.floor(Math.random() * 9);    // 9..17
      const status: AppointmentStatus =
        Math.random() < 0.65 ? 'confirmed' : 'pending';
      apptInputs.push(buildAppt(days, hour, status));
    }

    // Force 3 cancelled to test the visual
    const cancelIdx = [6, 11, 17];
    for (const idx of cancelIdx) {
      if (apptInputs[idx]) apptInputs[idx]!.status = 'cancelled';
    }

    await db.insert(appointments).values(apptInputs);

    return {
      data: {
        categories:   catRows.length,
        services:     svcRows.length,
        customers:    custRows.length,
        appointments: apptInputs.length,
      },
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to seed tenant data';
    return { data: null, error: { message: msg, code: 'DB_ERROR' } };
  }
}
