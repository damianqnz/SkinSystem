# WORKFLOWS.md: El Guion Operativo (SkinSystem)

This document coordinates the interaction between the user, the specialist and the system. It defines the sequential logic to be implemented in the service layer, in accordance with the infrastructure outlined in `ARCHITECTURE.md` and the tools listed in `TECH_STACK.md`.

---

## WF-01: The Booking, Payment and Conversion Journey
*Objective: To maximise sales and ensure marketing tracking without concurrency errors.*

1.  **Availability Check**: The system checks the specialist’s calendar, taking into account `Lead Time` (notice period), `Scheduling Window` (monthly window) and `Buffer Times` (clearing time).
2.  **Temporary Lock (Race Condition Protection)**:
    - When ‘Pay’ is clicked, a lock is activated in **Upstash Redis** for **5 minutes**.
    - The slot disappears from the public calendar. If the client does not complete payment within the time limit, the Redis TTL automatically releases the slot. (Ref: `ARCHITECTURE.md` - Section 7).
3.  **Checkout (Stripe Connect Standard)**:
    - Direct payment to the specialist’s account (Total, Fixed or Percentage).
    - The system acts as an orchestrator without holding funds.
4.  **Tracking and Redirection**:
    - Following a successful Stripe transaction ➔ Trigger Meta Pixel / GTM / GA4 events.
    - **Redirect Logic**: If `auto_redirect` is ON ➔ Redirect to `custom_redirect_url`; otherwise, display a themed internal page. (Ref: `DESIGN_SYSTEM.md`).

---

## WF-02: Communications and Automation (Evolution API)
*Objective: To eliminate no-shows through constant and personalised communication.*

1.  **Linking**: Each specialist scans their WhatsApp QR code from the Dashboard to connect their own number (Ref: `TECH_STACK.md`).
2.  **Automatic Sequence (Based on client locale)**:
    - **T-48h (Email)**: Preventive reminder.
    - **T-24h (WhatsApp)**: Automatic message announcing the end of the free cancellation window.
    - **T-1h (WhatsApp)**: Welcome, Google Maps location (direct link) and punctuality reminder.
3.  **Language**: Messages are sent strictly in the language selected by the client when booking (ES/PT/EN). (Ref: `STANDARDS.md` - Section 16).

---

## WF-03: Cancellations, Refunds and No-Shows
*Objective: To protect the specialist’s profitability and time.*

1.  **Deadline Validation**: The system compares the current time with the specialist’s policy (2h to 1 week).
2.  **Refund Logic (Financial)**:
    - Refunds deduct the bank commission: `Amount to refund = Original Payment - Stripe Fee`.
    - The specialist confirms the action after seeing the commission loss notice. (Ref: `STANDARDS.md` - Section 17).
3.  **No-Show (Inasistencia)**:
    - Manual registration by the specialist in the dashboard.
    - Stops the automatic transition to `IN_PROGRESS` and flags the client’s profile with an internal penalty. (Ref: `STANDARDS.md` - Section 15).

---

## WF-04: Clinical Session, Routines and PDF (iPad/Mobile)
*Objective: Security of sensitive data and immediate value delivery to the client.*

1.  **Access and Security**:
    - Biometric re-authentication (**WebAuthn**) to open medical records.
    - **Auto-Lock**: Session closure after 10 min of inactivity.
2.  **Automatic Statuses (Cron Job)**:
    - `CONFIRMADA` ➔ `IN_PROGRESS`: Automatic when the appointment time arrives (if not marked as No-Show).
    - `IN_PROGRESS` ➔ `COMPLETED`: Automatic at the end of the scheduled service period.
3.  **Dynamic Documentation (react-pdf)**:
    - **Record and Routine**: Lourdes/Gloria generate post-treatment recommendations.
    - **Language Selector**: Selector in the **Thumb-Zone** (ES | PT | EN) for the PDF before generating.
    - **Versionado**: Each change generates a new file (`v1`, `v2`) in the history; it is never overwritten. (Ref: `STANDARDS.md` - Section 19).

---

## WF-05: Monthly Reports and Integrations
*Objective: To automate administrative management and marketing.*

1.  **Management Report**:
    - **Trigger**: Scheduled task (Cron job) on the 1st of each month at 00:00.
    - **Action**: Generation of a summary PDF of income, services performed and conversion metrics.
    - **Storage**: Saved in Supabase Storage (Private for Owner role).
2.  **Marketing**: Option to link Mailchimp per organization for mass email marketing.
3.  **Billing**: Hook prepared for future implementation with **Monoli Software**.

---

## WF-06: Session Strategy and Cookies
*Objective: Smooth experience and brand persistence.*

1.  **Storage**: Use of asynchronous `cookieStore` (Next.js 16) to persist:
    - `tenant_id`: Identification of the organization (Lourdes/Gloria).
    - `locale`: User's preferred language.
    - `user_preferences`: Dark mode/light mode and accessibility.
2.  **Security**: Cookies configured as `SameSite: Lax` to ensure context loading from external links (WhatsApp/Email).

---

## WF-07: External Calendar Synchronization
*Objective: To avoid overlaps with the specialist's personal life.*

1.  **Sync Bidirectional**: Integration with Google Calendar API.
2.  **Preventive Block**: If the specialist adds a personal event to their Google Calendar, SkinSystem automatically blocks that space in the public calendar.
3.  **Resilience**: If the external API fails, the system prioritizes local blocking and retries synchronization every 15 min.

---

## WF-08: Role Management and Privacy
*Reference: See IDENTITY.md.*

1.  **Owner (Lourdes/Gloria)**: Full access to Stripe, Monthly Reports, Marketing Configuration and Integrations.
2.  **Staff**: Operational access to calendar, client records and routine generation. Total block of financial data, Stripe balances and API keys.

---

## Error Handling and Edge Cases
- **Payment Failure**: If the bank denies the card, the user can retry the payment immediately without losing the 5-minute lock.
- **Media Sync Error**: The system uses an **Upload Queue**; if the connection fails on the Asus or Mac, the photo upload resumes automatically when the signal is restored.
- **Time Reference**: All reminders and status changes are strictly governed by the physical clinic's timezone.