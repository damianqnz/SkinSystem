import 'server-only';

/**
 * Booking-domain seeder — DEV/DEMO ONLY.
 *
 * Generates realistic mock data scoped to a single tenant:
 *   - 3 categories  (Facial, Capilar, Corporal)
 *   - 8 services    (distributed, real prices in cents)
 *   - 20 customers  (rich profiles: company, country, city, social links)
 *       · 1 blocked customer (isBlocked=true) for UI testing
 *   - ~50 appointments
 *       · 10+ past (completed / no_show) — populates CompromisosTab history
 *       · 5  today/tomorrow (confirmed)
 *       · 15 future mixed (pending / confirmed / cancelled)
 *
 * Every row is tagged with the `__SEED_TAG__` marker so `clearSeedData`
 * can wipe ONLY mock data without touching real tenant content.
 */

import { eq, and, or, gte, like, inArray } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customers } from '@/domains/customers/schema';
import { catalogCategories, catalogServices } from '@/domains/catalog/schema';
import { appointments } from './schema';
import { payments, couponRedemptions } from '@/infrastructure/db/schema/booking';
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
  { category: 'facial',   name: { es: 'Limpieza Profunda',        pt: 'Limpeza Profunda',             en: 'Deep Cleansing'      }, duration: 60, cents: 5500,  color: '#E8C9B8' },
  { category: 'facial',   name: { es: 'Hydrafacial',              pt: 'Hydrafacial',                  en: 'Hydrafacial'         }, duration: 75, cents: 8500,  color: '#C9DCE5' },
  { category: 'facial',   name: { es: 'Tratamiento Antiedad',     pt: 'Tratamento Antienvelhecimento', en: 'Anti-aging'         }, duration: 90, cents: 12000, color: '#D4AF37' },
  { category: 'capilar',  name: { es: 'Mesoterapia Capilar',      pt: 'Mesoterapia Capilar',          en: 'Hair Mesotherapy'    }, duration: 60, cents: 9000,  color: '#B8A89C' },
  { category: 'capilar',  name: { es: 'Tratamiento Anticaída',    pt: 'Tratamento Anti-queda',        en: 'Hair Loss Treatment' }, duration: 45, cents: 7500,  color: '#A89C90' },
  { category: 'corporal', name: { es: 'Drenaje Linfático',        pt: 'Drenagem Linfática',           en: 'Lymphatic Drainage'  }, duration: 60, cents: 6000,  color: '#C5D5BC' },
  { category: 'corporal', name: { es: 'Radiofrecuencia',          pt: 'Radiofrequência',              en: 'Radiofrequency'      }, duration: 60, cents: 9500,  color: '#D5BCC5' },
  { category: 'corporal', name: { es: 'Presoterapia',             pt: 'Pressoterapia',                en: 'Pressotherapy'       }, duration: 45, cents: 4500,  color: '#BCC5D5' },
];

// ── Customer seed data ─────────────────────────────────────────────
type SeedStatus = 'nuevo' | 'recurrente' | 'riesgo' | 'inactivo' | 'perdido';

interface CustomerSeed {
  fullName:      string;
  email:         string;
  phone:         string;
  company?:      string;
  country?:      string;
  countryIso?:   string;
  city?:         string;
  state?:        string;
  address?:      string;
  postalCode?:   string;
  socialLinks?:  Record<string, unknown>;
  isBlocked?:    boolean;
  /** Pinned lifecycle status — overrides pg_cron until next nightly run */
  clientStatus?: SeedStatus;
}

const CUSTOMER_DATA: CustomerSeed[] = [
  {
    fullName: 'Sofia Coelho',
    email: 'sofia.coelho@example.pt',
    phone: '+351 912 345 678',
    country: 'Portugal', countryIso: 'PT',
    city: 'Lisboa', state: 'Lisboa', postalCode: '1000-001',
    socialLinks: { instagram: '@sofiacoelho_beauty', website: 'https://sofiacoelho.pt' },
  },
  {
    fullName: 'Maria Lourdes Silva',
    email: 'maria.silva@example.pt',
    phone: '+351 963 214 789',
    country: 'Portugal', countryIso: 'PT',
    city: 'Porto', state: 'Porto', postalCode: '4000-100',
  },
  {
    fullName: 'Cheryl Hernández',
    email: 'cheryl.hernandez@example.es',
    phone: '+34 612 345 678',
    company: 'Clínica Derma Madrid',
    country: 'España', countryIso: 'ES',
    city: 'Madrid', state: 'Community of Madrid', postalCode: '28001',
    socialLinks: { instagram: '@cherylhernandez', linkedin: 'linkedin.com/in/cherylhernandez' },
  },
  {
    fullName: 'Micaela Faustino',
    email: 'micaela.faustino@example.pt',
    phone: '+351 934 567 890',
    country: 'Portugal', countryIso: 'PT',
    city: 'Braga', state: 'Braga',
    socialLinks: { instagram: '@micaelafaustino' },
  },
  {
    fullName: 'Juliana Dias',
    email: 'juliana.dias@example.br',
    phone: '+55 11 91234 5678',
    company: 'Studio Beleza SP',
    country: 'Brasil', countryIso: 'BR',
    city: 'São Paulo', state: 'São Paulo', postalCode: '01310-100',
    socialLinks: { instagram: '@julidias_sp', website: 'https://studiobelezasp.com.br' },
  },
  {
    fullName: 'Daniela Abreu',
    email: 'daniela.abreu@example.pt',
    phone: '+351 926 789 012',
    country: 'Portugal', countryIso: 'PT',
    city: 'Coimbra', state: 'Coimbra', postalCode: '3000-200',
  },
  {
    fullName: 'Carla Prata',
    email: 'carla.prata@example.pt',
    phone: '+351 918 901 234',
    country: 'Portugal', countryIso: 'PT',
    city: 'Faro', state: 'Faro',
    socialLinks: { instagram: '@carlaprata.skin' },
  },
  {
    fullName: 'Andreia Gomes',
    email: 'andreia.gomes@example.pt',
    phone: '+351 965 432 109',
    company: 'AG Eventos Lisboa',
    country: 'Portugal', countryIso: 'PT',
    city: 'Lisboa', state: 'Lisboa', postalCode: '1200-305',
    address: 'Rua da Prata, 45 - 2º Dto',
    socialLinks: { instagram: '@andreiagomes_oficial', facebook: 'fb.com/andreiagomes' },
  },
  {
    fullName: 'Susana Franco',
    email: 'susana.franco@example.es',
    phone: '+34 634 567 890',
    country: 'España', countryIso: 'ES',
    city: 'Barcelona', state: 'Catalonia', postalCode: '08001',
    socialLinks: { instagram: '@susanafranco_bcn' },
  },
  {
    fullName: 'Mariz Vera',
    email: 'mariz.vera@example.pt',
    phone: '+351 916 543 210',
    country: 'Portugal', countryIso: 'PT',
    city: 'Setúbal', state: 'Setúbal',
  },
  {
    fullName: 'Teresa Martins',
    email: 'teresa.martins@example.pt',
    phone: '+351 962 109 876',
    company: 'Farmácia Martins',
    country: 'Portugal', countryIso: 'PT',
    city: 'Évora', state: 'Évora', postalCode: '7000-500',
    address: 'Praça do Giraldo, 10',
  },
  {
    fullName: 'Lucia Navarro',
    email: 'lucia.navarro@example.es',
    phone: '+34 678 901 234',
    country: 'España', countryIso: 'ES',
    city: 'Sevilla', state: 'Andalusia', postalCode: '41001',
    socialLinks: { instagram: '@lucianavarro_skin', tiktok: '@lucianavarro' },
  },
  {
    fullName: 'Raquel Folques',
    email: 'raquel.folques@example.pt',
    phone: '+351 938 765 432',
    country: 'Portugal', countryIso: 'PT',
    city: 'Aveiro', state: 'Aveiro',
    socialLinks: { instagram: '@raquelfolques' },
  },
  {
    fullName: 'Yolanda Mateus',
    email: 'yolanda.mateus@example.pt',
    phone: '+351 967 890 123',
    company: 'YM Consulting',
    country: 'Portugal', countryIso: 'PT',
    city: 'Lisboa', state: 'Lisboa', postalCode: '1050-180',
    address: 'Av. da Liberdade, 230 - 3º',
    socialLinks: { linkedin: 'linkedin.com/in/yolandamateus', website: 'https://ymconsulting.pt' },
  },
  {
    fullName: 'Ana De Brito',
    email: 'ana.debrito@example.pt',
    phone: '+351 912 678 901',
    country: 'Portugal', countryIso: 'PT',
    city: 'Funchal', state: 'Madeira', postalCode: '9000-001',
    socialLinks: { instagram: '@anadebrito_funchal' },
  },
  {
    fullName: 'Beatriz Monteiro',
    email: 'beatriz.monteiro@example.pt',
    phone: '+351 964 321 098',
    country: 'Portugal', countryIso: 'PT',
    city: 'Porto', state: 'Porto', postalCode: '4150-400',
    socialLinks: { instagram: '@beatrizmonteiro', facebook: 'fb.com/beatrizmonteiro' },
  },
  {
    fullName: 'Carmen Vidal',
    email: 'carmen.vidal@example.es',
    phone: '+34 623 456 789',
    company: 'Vidal & Partners',
    country: 'España', countryIso: 'ES',
    city: 'Valencia', state: 'Valencia', postalCode: '46001',
    address: 'Calle Colón, 55 - 1º',
    socialLinks: { instagram: '@carmenvidal_v', linkedin: 'linkedin.com/in/carmenvidal' },
  },
  {
    fullName: 'Inês Rodrigues',
    email: 'ines.rodrigues@example.pt',
    phone: '+351 935 678 901',
    country: 'Portugal', countryIso: 'PT',
    city: 'Leiria', state: 'Leiria',
    socialLinks: { instagram: '@inesrodrigues_care' },
  },
  {
    fullName: 'Paula Esteves',
    email: 'paula.esteves@example.pt',
    phone: '+351 921 234 567',
    country: 'Portugal', countryIso: 'PT',
    city: 'Viseu', state: 'Viseu',
  },
  // Blocked customer — testing isBlocked UI
  {
    fullName: 'Roberto Almeida',
    email: 'roberto.almeida@example.pt',
    phone: '+351 968 012 345',
    country: 'Portugal', countryIso: 'PT',
    city: 'Lisboa', state: 'Lisboa',
    isBlocked: true,
  },

  // ── Lifecycle status showcase ─────────────────────────────────
  // Appointments will be created at exact day offsets to match getClientStatus() thresholds.
  // clientStatus is also set explicitly so sidebar shows the badge without waiting for pg_cron.

  // recurrente: last completed visit -15 days → d=15, not ≥30 → falls through → totalVisits≥2 ✓
  {
    fullName:     'Valentina Ruiz',
    email:        'valentina.ruiz@example.es',
    phone:        '+34 651 234 567',
    country:      'España', countryIso: 'ES',
    city:         'Málaga', state: 'Andalusia',
    clientStatus: 'recurrente',
  },
  // riesgo: last completed visit -35 days → d=35, ≥30 and <45 → 'riesgo' ✓
  {
    fullName:     'Beatriz Sousa',
    email:        'beatriz.sousa@example.pt',
    phone:        '+351 927 654 321',
    country:      'Portugal', countryIso: 'PT',
    city:         'Setúbal', state: 'Setúbal',
    clientStatus: 'riesgo',
  },
  // inactivo: last completed visit -52 days → d=52, ≥45 and <60 → 'inactivo' ✓
  {
    fullName:     'Elena Morales',
    email:        'elena.morales@example.es',
    phone:        '+34 698 765 432',
    country:      'España', countryIso: 'ES',
    city:         'Bilbao', state: 'Basque Country',
    clientStatus: 'inactivo',
  },
  // perdido: last completed visit -75 days → d=75, ≥60 → 'perdido' ✓
  {
    fullName:     'Natasha Ferreira',
    email:        'natasha.ferreira@example.pt',
    phone:        '+351 913 456 789',
    country:      'Portugal', countryIso: 'PT',
    city:         'Guimarães', state: 'Braga',
    clientStatus: 'perdido',
  },
];

// ── Cleanup ────────────────────────────────────────────────────────
/**
 * Removes every row tagged as seed for the given tenant.
 *
 * FK-safe deletion order:
 *   payments → coupon_redemptions → appointments
 *   → customers → catalog_services → catalog_categories
 *
 * Tags used:
 *   - customers.notes    = SEED_TAG
 *   - catalog_services.slug LIKE '__seed__%'
 *   - catalog_categories.sortOrder >= 9000
 */
export async function clearSeedData(orgId: string): Promise<Result<{ removed: number }>> {
  try {
    let total = 0;

    // 1. Identify seed customers + seed services
    const seedCustomers = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.organizationId, orgId), eq(customers.notes, SEED_TAG)));
    const seedCustIds = seedCustomers.map(c => c.id);

    const seedServices = await db
      .select({ id: catalogServices.id })
      .from(catalogServices)
      .where(and(
        eq(catalogServices.organizationId, orgId),
        like(catalogServices.slug, `${SEED_TAG}%`),
      ));
    const seedSvcIds = seedServices.map(s => s.id);

    // 2. Identify all seed appointments (by customer OR service)
    let seedApptIds: string[] = [];
    if (seedCustIds.length > 0 || seedSvcIds.length > 0) {
      const orClauses = [];
      if (seedCustIds.length > 0) orClauses.push(inArray(appointments.customerId, seedCustIds));
      if (seedSvcIds.length > 0)  orClauses.push(inArray(appointments.serviceId,  seedSvcIds));
      const apptRows = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(and(
          eq(appointments.organizationId, orgId),
          orClauses.length === 1 ? orClauses[0]! : or(...orClauses)!,
        ));
      seedApptIds = apptRows.map(a => a.id);
    }

    // 3. Delete child FK rows first: payments → coupon_redemptions
    if (seedApptIds.length > 0) {
      const pmtDel = await db.delete(payments)
        .where(inArray(payments.appointmentId, seedApptIds))
        .returning({ id: payments.id });
      total += pmtDel.length;

      const coupDel = await db.delete(couponRedemptions)
        .where(inArray(couponRedemptions.appointmentId, seedApptIds))
        .returning({ id: couponRedemptions.id });
      total += coupDel.length;
    }

    // 4. Delete seed appointments
    if (seedApptIds.length > 0) {
      const apptDel = await db.delete(appointments)
        .where(inArray(appointments.id, seedApptIds))
        .returning({ id: appointments.id });
      total += apptDel.length;
    }

    // 5. Delete seed customers
    if (seedCustIds.length > 0) {
      const custDel = await db.delete(customers)
        .where(and(eq(customers.organizationId, orgId), eq(customers.notes, SEED_TAG)))
        .returning({ id: customers.id });
      total += custDel.length;
    }

    // 6. Delete seed services
    if (seedSvcIds.length > 0) {
      const svcDel = await db.delete(catalogServices)
        .where(and(
          eq(catalogServices.organizationId, orgId),
          like(catalogServices.slug, `${SEED_TAG}%`),
        ))
        .returning({ id: catalogServices.id });
      total += svcDel.length;
    }

    // 7. Delete seed categories (sortOrder >= 9000 is the seed range)
    const catDel = await db.delete(catalogCategories)
      .where(and(
        eq(catalogCategories.organizationId, orgId),
        gte(catalogCategories.sortOrder, 9000),
      ))
      .returning({ id: catalogCategories.id });
    total += catDel.length;

    return { data: { removed: total }, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to clear seed data';
    return { data: null, error: { message: msg, code: 'DB_ERROR' } };
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
      CUSTOMER_DATA.map((c) => ({
        organizationId: orgId,
        fullName:       c.fullName,
        email:          c.email,
        phone:          c.phone,
        isGuest:        false,
        notes:          SEED_TAG,
        company:        c.company      ?? null,
        country:        c.country      ?? null,
        countryIso:     c.countryIso   ?? null,
        city:           c.city         ?? null,
        state:          c.state        ?? null,
        address:        c.address      ?? null,
        postalCode:     c.postalCode   ?? null,
        socialLinks:    c.socialLinks  ?? null,
        isBlocked:      c.isBlocked    ?? false,
        clientStatus:   c.clientStatus ?? 'nuevo',
      })),
    ).returning({ id: customers.id });

    // Indices of the 4 lifecycle customers (appended at end of CUSTOMER_DATA)
    const [lcRecurrente, lcRiesgo, lcInactivo, lcPerdido] = custRows.slice(-4).map(c => c.id);

    // 4. Appointments
    const pickCustomer = () => custRows[Math.floor(Math.random() * custRows.length)]!.id;
    const pickService  = () => svcRows[Math.floor(Math.random() * svcRows.length)]!;

    function buildAppt(daysFromToday: number, hour: number, status: AppointmentStatus, custId?: string) {
      const start = new Date();
      start.setHours(hour, 0, 0, 0);
      start.setDate(start.getDate() + daysFromToday);
      const svc = pickService();
      const end = new Date(start.getTime() + svc.duration * 60_000);
      return {
        organizationId:   orgId,
        customerId:       custId ?? pickCustomer(),
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
    }

    // Pin first 4 customers to have rich past history for CompromisosTab
    const richCustIds = custRows.slice(0, 4).map(c => c.id);

    const apptInputs: Array<ReturnType<typeof buildAppt>> = [];

    // ── PAST appointments (history) ──────────────────────────────────
    // 12 completed — distributed across last 90 days
    const PAST_DAYS  = [-3,-7,-12,-18,-22,-30,-38,-45,-52,-60,-72,-85];
    const PAST_HOURS = [10, 11, 9, 14, 16, 10, 15, 11, 14, 10, 16, 9];
    for (let i = 0; i < PAST_DAYS.length; i++) {
      // Rotate among the first 4 rich customers so their histories are populated
      const custId = richCustIds[i % richCustIds.length];
      apptInputs.push(buildAppt(PAST_DAYS[i]!, PAST_HOURS[i]!, 'completed', custId));
    }

    // 3 no_shows in the past
    apptInputs.push(buildAppt(-15, 10, 'no_show', richCustIds[0]));
    apptInputs.push(buildAppt(-40, 14, 'no_show', richCustIds[2]));
    apptInputs.push(buildAppt(-65, 11, 'no_show'));

    // 4 cancelled in the past
    apptInputs.push(buildAppt(-5,  16, 'cancelled'));
    apptInputs.push(buildAppt(-25, 9,  'cancelled'));
    apptInputs.push(buildAppt(-50, 15, 'cancelled', richCustIds[1]));
    apptInputs.push(buildAppt(-80, 10, 'cancelled'));

    // ── LIFECYCLE STATUS appointments ────────────────────────────────
    // Each customer gets 3 completed visits whose dates match getClientStatus() thresholds.
    // recurrente  → last -15 d  (d<30  → time rule skips → totalVisits≥2 → 'recurrente')
    // riesgo      → last -35 d  (d≥30 && d<45 → 'riesgo')
    // inactivo    → last -52 d  (d≥45 && d<60 → 'inactivo')
    // perdido     → last -75 d  (d≥60          → 'perdido')
    if (lcRecurrente) {
      apptInputs.push(buildAppt(-15,  10, 'completed', lcRecurrente));
      apptInputs.push(buildAppt(-45,  11, 'completed', lcRecurrente));
      apptInputs.push(buildAppt(-90,  14, 'completed', lcRecurrente));
    }
    if (lcRiesgo) {
      apptInputs.push(buildAppt(-35,  10, 'completed', lcRiesgo));
      apptInputs.push(buildAppt(-60,  15, 'completed', lcRiesgo));
      apptInputs.push(buildAppt(-100, 11, 'completed', lcRiesgo));
    }
    if (lcInactivo) {
      apptInputs.push(buildAppt(-52,  10, 'completed', lcInactivo));
      apptInputs.push(buildAppt(-80,  14, 'completed', lcInactivo));
      apptInputs.push(buildAppt(-120, 10, 'completed', lcInactivo));
    }
    if (lcPerdido) {
      apptInputs.push(buildAppt(-75,  11, 'completed', lcPerdido));
      apptInputs.push(buildAppt(-110, 15, 'completed', lcPerdido));
      apptInputs.push(buildAppt(-150, 10, 'completed', lcPerdido));
    }

    // ── TODAY & TOMORROW (confirmed) ─────────────────────────────────
    apptInputs.push(buildAppt(0, 10, 'confirmed'));
    apptInputs.push(buildAppt(0, 14, 'confirmed'));
    apptInputs.push(buildAppt(1, 9,  'confirmed'));
    apptInputs.push(buildAppt(1, 11, 'confirmed'));
    apptInputs.push(buildAppt(1, 16, 'confirmed'));

    // ── FUTURE mixed (pending / confirmed / cancelled) ───────────────
    for (let i = 0; i < 15; i++) {
      const days   = 2 + Math.floor(Math.random() * 8);
      const hour   = 9 + Math.floor(Math.random() * 9);
      const roll   = Math.random();
      const status: AppointmentStatus =
        roll < 0.55 ? 'confirmed' : roll < 0.80 ? 'pending' : 'cancelled';
      apptInputs.push(buildAppt(days, hour, status));
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
