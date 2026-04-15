# WORKFLOWS.md: Operational Orchestration (SkinSystem)

This document coordinates the interaction between the user, the specialist, and the system. It defines the sequential logic to be implemented in the service layer, in accordance with `ARCHITECTURE.md` and `TECH_STACK.md`.

---

## WF-01: The Booking, Payment, and Conversion Journey
*Objective: Maximize sales and ensure tracking without concurrency errors.*

1.  **Availability Check**: The system checks the specialist’s calendar, considering `Lead Time` (notice period), `Scheduling Window` (monthly window), and `Buffer Times` (cleanup time).
2.  **Temporary Lock (Race Condition Protection)**:
    - Upon clicking 'Pay', a lock is activated in **Upstash Redis** for **5 minutes (TTL)**.
    - The slot is hidden from the public calendar. If payment is not completed, the Redis TTL automatically releases the slot.
3.  **Checkout (Stripe Connect Standard)**:
    - Direct payment to the specialist’s linked account.
    - System acts as an orchestrator; no funds are held by the platform.
4.  **Tracking & Redirection**:
    - Post-success: Trigger Meta Pixel / GTM / GA4 events.
    - **Redirect Logic**: If `auto_redirect` is ON ➔ Redirect to `custom_redirect_url`; else, display a themed internal success page (Ref: `DESIGN_SYSTEM.md`).

---

## WF-02: Communications & Automation (Evolution API)
*Objective: Eliminate no-shows through personalized, cost-free WhatsApp communication.*

1.  **Linking**: Specialists scan the WhatsApp QR code from the Dashboard to connect their instance (Ref: `TECH_STACK.md`).
2.  **Automatic Sequence (Locale-based)**:
    - **T-48h (Email)**: Preventive reminder via Resend.
    - **T-24h (WhatsApp)**: Automatic message announcing the end of the free cancellation window.
    - **T-1h (WhatsApp)**: Welcome message with Google Maps direct link and punctuality reminder.
3.  **Language**: Messages are strictly governed by the client's booking `locale` (ES/PT/EN).

---

## WF-03: Cancellations, Refunds, and No-Shows
*Objective: Protect specialist profitability and time.*

1.  **Deadline Validation**: System compares current time vs. specialist policy (e.g., 24h notice).
2.  **Refund Logic**:
    - Refunds are processed as: `Original Payment - Stripe Fee`.
    - Specialist must confirm the action after viewing the commission loss notice.
3.  **No-Show (Inasistencia)**:
    - Manual registration by the specialist.
    - This action stops the automatic status transition and flags the client profile for future bookings.

---

## WF-04: Clinical Session, Routines, and PDF (iPad/Mobile)
*Objective: Secure handling of sensitive health data and immediate value delivery.*

1.  **Access Security**:
    - Biometric re-authentication (**WebAuthn/FaceID**) required to open medical records.
    - **Auto-Lock**: Session expires after 10 minutes of inactivity.
2.  **Automatic Status Transitions (Cron Job)**:
    - `CONFIRMED` ➔ `IN_PROGRESS`: Triggered at appointment start time.
    - `IN_PROGRESS` ➔ `COMPLETED`: Triggered at appointment end time.
3.  **Dynamic Documentation (react-pdf)**:
    - **Record and Routine**: Specialist generates post-treatment recommendations.
    - **Language Selector**: UI selector in the **Thumb-Zone** (ES | PT | EN) before generation.
    - **Versioning**: Every update creates a new version (`v1`, `v2`) in Supabase Storage; files are never overwritten.

---

## WF-05: Monthly Reports and Integrations
1.  **Management Report**: Cron job triggers on the 1st of each month. Generates a summary PDF of income and conversion metrics (Stored in Private Storage).
2.  **Marketing**: Optional Mailchimp sync per organization.
3.  **Billing**: Integration hook ready for future **Monoli Software** implementation.

---

## WF-06: Session Strategy and Cookies
1.  **Storage**: Use of Next.js 16 `cookies()` (async) to persist:
    - `tenant_id`: Organization identification.
    - `locale`: User's preferred language.
    - `user_preferences`: Theme (Dark/Light) and accessibility settings.
2.  **Security**: Cookies set to `SameSite: Lax` to ensure context loading from external WhatsApp/Email links.

---

## WF-07: External Calendar Synchronization
1.  **Bidirectional Sync**: Integration with Google Calendar API.
2.  **Preventive Block**: Personal events in the specialist's Google Calendar automatically block availability in SkinSystem.
3.  **Resilience**: If the API fails, local blocking is prioritized, with retry attempts every 15 minutes.

---

## WF-08: Role-Based Operational Access
1.  **Owner**: Full access to Financials, Stripe, Reports, and Marketing.
2.  **Staff**: Access to Calendar, Clinical Records, and Routine generation. Blocked from viewing income, balances, and API keys.

---

## Error Handling & Edge Cases
- **Payment Failure**: Users can retry payment immediately without losing the 5-minute Redis lock.
- **Media Sync Error**: Background **Upload Queue** for photos. Resumes automatically if connection is lost on Mac/Asus devices.
- **Time Reference**: All events are governed by the physical clinic's local timezone, stored in UTC.