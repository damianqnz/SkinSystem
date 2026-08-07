'use client';

import { useState }        from 'react';
import { useRouter }       from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft }     from 'lucide-react';
import { StepIndicator }   from './StepIndicator';
import { Step1Service }    from './Step1Service';
import { Step2Calendar }   from './Step2Calendar';
import { Step2Auth }       from './Step2Auth';
import { Step3Confirm }    from './Step3Confirm';
import { BookingSummary }  from './BookingSummary';
import { bookT }           from '../_i18n';
import type { SelectService }  from '@/domains/catalog/schema';
import type { PublicSlot, BookingConfig, SurchargeItem } from '../actions';

// ── Motion config ─────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const variants = {
  enter:  (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

type Step = 'service' | 'calendar' | 'auth' | 'confirm';

// ── Types ─────────────────────────────────────────────────────

interface AppliedCoupon {
  id:            string;
  discountType:  'percent' | 'fixed';
  discountValue: number;
  code:          string;
}

interface OrgData {
  name:        string;
  logoUrl:     string | null;
  address:     string | null;
  city:        string | null;
  avgRating:   number;
  reviewCount: number;
}

interface AuthUser {
  name:  string;
  email: string;
}

// ── Props ─────────────────────────────────────────────────────

interface BookingFunnelProps {
  services:        SelectService[];
  locale:          string;
  initialService?: string;
  config:          BookingConfig;
  surcharges:      SurchargeItem[];
  orgData:         OrgData;
  /**
   * Current Supabase session user resolved on the server.
   * When present, the `'auth'` step is skipped entirely and
   * `Step3Confirm` renders the AuthenticatedConfirm view with
   * no "checking session" spinner flash.
   */
  authUser:        AuthUser | null;
}

// ── Step order helper ─────────────────────────────────────────

/**
 * The `'auth'` step is inserted only when the tenant has
 * `clientLoginEnabled` AND the visitor is not already logged in.
 * This keeps the StepIndicator honest (no 4→3 collapse mid-flow)
 * and avoids asking already-authenticated users to log in twice.
 */
function getStepOrder(showAuth: boolean, isAuthenticated: boolean): Step[] {
  const base: Step[] = ['service', 'calendar'];
  if (showAuth && !isAuthenticated) base.push('auth');
  base.push('confirm');
  return base;
}

// ── Component ─────────────────────────────────────────────────

export function BookingFunnel({
  services,
  locale,
  initialService,
  config,
  surcharges,
  orgData,
  authUser,
}: BookingFunnelProps) {
  const preSelected = initialService
    ? services.find((s) => s.id === initialService)
    : undefined;

  const router          = useRouter();
  const isAuthenticated = authUser !== null;
  const showAuth        = config.clientLoginEnabled;
  const stepOrder       = getStepOrder(showAuth, isAuthenticated);
  const t               = bookT(locale);

  // When coming from the catalog (/book?service=<id>), start at calendar
  const initialStep: Step = preSelected ? 'calendar' : 'service';

  const [step,          setStep]          = useState<Step>(initialStep);
  const [dir,           setDir]           = useState<1 | -1>(1);
  const [service,       setService]       = useState<SelectService | null>(preSelected ?? null);
  const [slot,          setSlot]          = useState<PublicSlot | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  function goTo(next: Step) {
    const curIdx  = stepOrder.indexOf(step);
    const nextIdx = stepOrder.indexOf(next);
    setDir(nextIdx > curIdx ? 1 : -1);
    setStep(next);
  }

  function handleServiceSelect(svc: SelectService) {
    setService(svc);
    goTo('calendar');
  }

  function handleSlotSelect(s: PublicSlot) {
    setSlot(s);
    // Skip the auth step when the user is already logged in — the
    // tenant flag only governs whether we show a login wall to guests.
    if (showAuth && !isAuthenticated) {
      goTo('auth');
    } else {
      goTo('confirm');
    }
  }

  function handleAuthenticated() {
    goTo('confirm');
  }

  function handleContinueAsGuest() {
    goTo('confirm');
  }

  function handleBack() {
    // If we came from the catalog and we're on step 2 (calendar),
    // go back to the catalog page instead of Step1Service
    if (step === 'calendar' && initialService) {
      router.push('/book');
      return;
    }
    const curIdx = stepOrder.indexOf(step);
    if (curIdx > 0) {
      const prevStep = stepOrder[curIdx - 1]!;
      if (prevStep === 'calendar') setSlot(null);
      goTo(prevStep);
    }
  }

  // ── Layout logic ───────────────────────────────────────────
  // Show side panel from calendar step onwards
  const showSidePanel = step !== 'service';

  return (
    <div className={[
      'mx-auto',
      showSidePanel
        ? 'grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start'
        : 'max-w-xl',
    ].join(' ')}>

      {/* Main content column */}
      <div>
        {/* Step indicator — `auth` dot only when it's actually part of this user's journey */}
        <StepIndicator
          current={step}
          showAuthStep={showAuth && !isAuthenticated}
          locale={locale}
        />

        {/* Back button */}
        {step !== 'service' && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 mb-4 transition-colors"
          >
            <ChevronLeft size={14} />
            {t.common.back}
          </button>
        )}

        {/* Animated step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: EASE }}
          >
            {step === 'service' && (
              <Step1Service
                services={services}
                locale={locale}
                onSelect={handleServiceSelect}
              />
            )}

            {step === 'calendar' && service && (
              <Step2Calendar
                serviceId={service.id}
                locale={locale}
                weekStartDay={config.weekStartDay}
                timeFormat={config.timeFormat}
                bookingWindowDays={config.bookingWindowDays}
                leadTimeHours={config.bookingLeadTimeHours}
                onSelect={handleSlotSelect}
              />
            )}

            {step === 'auth' && showAuth && (
              <Step2Auth
                loginRequired={config.clientLoginRequired}
                locale={locale}
                onAuthenticated={handleAuthenticated}
                onContinueAsGuest={handleContinueAsGuest}
              />
            )}

            {step === 'confirm' && service && slot && (
              <Step3Confirm
                service={service}
                slot={slot}
                locale={locale}
                config={config}
                surcharges={surcharges}
                appliedCoupon={appliedCoupon}
                initialAuthUser={authUser}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky side panel — calendar step and beyond */}
      {showSidePanel && (
        <div className="lg:sticky lg:top-20">
          <BookingSummary
            orgData={orgData}
            service={service}
            slot={slot}
            surcharges={surcharges}
            locale={locale}
            showPrices={config.showServicePrices}
            appliedCoupon={appliedCoupon}
            onCouponApply={setAppliedCoupon}
            onCouponRemove={() => setAppliedCoupon(null)}
          />
        </div>
      )}
    </div>
  );
}
