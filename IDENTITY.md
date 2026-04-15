# Project Identity: SkinSystem (Beauty Platform)

## 1. Project Summary
A premium multi-tenant SaaS for aesthetic and hair styling management. Designed for the operational independence of individual specialists (Lourdes and Gloria) with a technical architecture prepared for unified physical locations.

## 2. Stakeholders
- **Lourdes**: Specialist in Facial Aesthetics and Skin Health.
- **Gloria**: Expert Colorist, Makeup, and Bridal styling (Glowding).

## 3. Core Values
- **Subdomain Isolation**: 100% isolated catalogs and agendas per specialist subdomain (`lourdes.lvh.me` vs `gloria.lvh.me`).
- **Minimalism**: Editorial, clean, and luxury aesthetic (The "New Internet" look).
- **Traceability**: Clinical and technical follow-up for every service via versioned PDFs.

---

## 4. Authentication & Identity Model
*Reference: See ARCHITECTURE.md for subdomain routing logic.*

### 4.1 Account vs Profile
- **Single Identity**: Users have a unique account in Supabase Auth based on their email.
- **Multiple Memberships**: A single account can have multiple entries in the `profiles` table, each linked to a different `organization_id`.
- **Domain Locking**: Authentication is valid only for the specific tenant subdomain. Accessing `lourdes.skinsystem.pt` does not grant access to `gloria.skinsystem.pt` unless the user has an active profile in both organizations.

---

## 5. RBAC (Role-Based Access Control)
*Reference: See STANDARDS.md for UI permission rules.*

### 5.1 Owner (Lourdes/Gloria)
- **Permissions**: Full access to the Dashboard, Stripe Configuration, Financial Analytics, and Staff Management.
- **UI View**: High-level business overview and fiscal settings.

### 5.2 Staff (Future employees)
- **Permissions**: Access to the Shared Calendar, Customer Clinical Records, and Data/Photo upload.
- **Restrictions**: Strictly prohibited from viewing Stripe keys, total organization income, or fiscal data.

### 5.3 Client (Customer)
- **Permissions**: Booking management, profile update, and access to personal Home Care routines (PDFs).
- **UI View**: Minimalist consumer-facing dashboard (`/me`). No access to any admin `/dashboard` routes.

---

## 6. Security Standards
- **Data Privacy**: Health data (Medical Records) is protected by **RLS** and requires biometric re-authentication (**WebAuthn/FaceID**) for viewing on supported devices (iPad/iPhone).
- **Session Auto-Lock**: Administrative sessions automatically lock after 10 minutes of inactivity to protect sensitive patient information.