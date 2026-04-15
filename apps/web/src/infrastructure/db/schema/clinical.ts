import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  numeric,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';
import {
  invasivenessLevelEnum,
  documentTypeEnum,
  cycleStatusEnum,
  sessionPhotoTypeEnum,
  adherenceStatusEnum,
  prescriptionPeriodEnum,
} from './enums';
import { organizations } from './organizations';
import { profiles } from './organizations';
import { customers } from './customers';
import { appointments } from './booking';

// ── document_templates ────────────────────────────────────────
// Immutable versioning: never edit — create new row with version+1
export const documentTemplates = pgTable('document_templates', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentType:      documentTypeEnum('document_type').notNull(),
  /** NULL only for document_type = 'clinical_evaluation' */
  invasivenessLevel: invasivenessLevelEnum('invasiveness_level'),
  title:             text('title').notNull(),
  contentHtml:       text('content_html').notNull(),
  version:           smallint('version').notNull().default(1),
  isActive:          boolean('is_active').notNull().default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── treatment_cycles ──────────────────────────────────────────
// Groups sessions under a therapeutic objective
export const treatmentCycles = pgTable('treatment_cycles', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  organizationId:      uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:          uuid('customer_id').notNull().references(() => customers.id),
  title:               text('title').notNull(),
  goal:                text('goal'),
  startedAt:           timestamp('started_at', { withTimezone: true }),
  endedAt:             timestamp('ended_at', { withTimezone: true }),
  status:              cycleStatusEnum('status').notNull().default('active'),
  createdByProfileId:  uuid('created_by_profile_id').notNull().references(() => profiles.id),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── signed_documents ──────────────────────────────────────────
// Immutable record of each signed document. Supports dual signature.
export const signedDocuments = pgTable('signed_documents', {
  id:                         uuid('id').primaryKey().defaultRandom(),
  organizationId:             uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:                 uuid('customer_id').notNull().references(() => customers.id),
  documentTemplateId:         uuid('document_template_id').notNull().references(() => documentTemplates.id),
  appointmentId:              uuid('appointment_id').references(() => appointments.id),
  treatmentCycleId:           uuid('treatment_cycle_id').references(() => treatmentCycles.id),
  professionalProfileId:      uuid('professional_profile_id').notNull().references(() => profiles.id),
  /** base64 encoded */
  professionalSignatureData:  text('professional_signature_data').notNull(),
  professionalSignedAt:       timestamp('professional_signed_at', { withTimezone: true }).notNull(),
  /** base64 encoded, nullable until client signs */
  clientSignatureData:        text('client_signature_data'),
  clientSignedAt:             timestamp('client_signed_at', { withTimezone: true }),
  // Invalidation (only for clinical_evaluation on clinical changes)
  // Previous row kept with invalidated_at != NULL (history preserved)
  invalidatedAt:              timestamp('invalidated_at', { withTimezone: true }),
  invalidatedReason:          text('invalidated_reason'),
  pdfStoragePath:             text('pdf_storage_path'),
  emailSentAt:                timestamp('email_sent_at', { withTimezone: true }),
  createdAt:                  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── clinical_sessions ─────────────────────────────────────────
// One session per completed appointment. Core of clinical tracking.
export const clinicalSessions = pgTable('clinical_sessions', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  organizationId:      uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  appointmentId:       uuid('appointment_id').notNull().unique().references(() => appointments.id),
  customerId:          uuid('customer_id').notNull().references(() => customers.id),
  treatmentCycleId:    uuid('treatment_cycle_id').references(() => treatmentCycles.id),
  skinReactionNotes:   text('skin_reaction_notes'),
  professionalNotes:   text('professional_notes'),
  createdByProfileId:  uuid('created_by_profile_id').notNull().references(() => profiles.id),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── facial_zone_annotations ───────────────────────────────────
// clinical_session_id IS NULL  → base map (initial diagnosis)
// clinical_session_id IS SET   → annotation for that specific session
export const facialZoneAnnotations = pgTable('facial_zone_annotations', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:        uuid('customer_id').notNull().references(() => customers.id),
  clinicalSessionId: uuid('clinical_session_id').references(() => clinicalSessions.id),
  zoneKey:           text('zone_key').notNull(),
  annotation:        text('annotation').notNull(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── session_photos ────────────────────────────────────────────
// Signed URLs (60 min) generated at app layer via Supabase Storage
export const sessionPhotos = pgTable('session_photos', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clinicalSessionId: uuid('clinical_session_id').notNull().references(() => clinicalSessions.id),
  photoType:         sessionPhotoTypeEnum('photo_type').notNull(),
  storagePath:       text('storage_path').notNull(),
  takenAt:           timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── equipment_catalog ─────────────────────────────────────────
// params_schema defines machine parameters as JSONB array
export const equipmentCatalog = pgTable('equipment_catalog', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  brand:          text('brand'),
  category:       text('category'),
  /**
   * Array of parameter definitions:
   * [{ key, label, unit, type: 'number'|'select', min?, max?, options?: [] }]
   */
  paramsSchema:   jsonb('params_schema').notNull().default([]),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── session_equipment_log ─────────────────────────────────────
// Actual parameters used per machine per session
export const sessionEquipmentLog = pgTable('session_equipment_log', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clinicalSessionId: uuid('clinical_session_id').notNull().references(() => clinicalSessions.id),
  equipmentId:       uuid('equipment_id').notNull().references(() => equipmentCatalog.id),
  /** Validated against paramsSchema at service layer */
  paramsUsed:        jsonb('params_used').notNull().default({}),
  durationMinutes:   smallint('duration_minutes'),
  zoneApplied:       text('zone_applied'),
  notes:             text('notes'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── product_catalog ───────────────────────────────────────────
// Soft-delete only — physical DELETE blocked if used in sessions (service layer)
export const productCatalog = pgTable('product_catalog', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  brand:          text('brand'),
  category:       text('category'),
  description:    text('description'),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── session_products_used ─────────────────────────────────────
export const sessionProductsUsed = pgTable('session_products_used', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clinicalSessionId: uuid('clinical_session_id').notNull().references(() => clinicalSessions.id),
  productId:         uuid('product_id').notNull().references(() => productCatalog.id),
  quantityUsed:      text('quantity_used'),
  applicationZone:   text('application_zone'),
  notes:             text('notes'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── body_measurements ─────────────────────────────────────────
// measured_at is independent of created_at for evolution graphs
export const bodyMeasurements = pgTable('body_measurements', {
  id:                uuid('id').primaryKey().defaultRandom(),
  organizationId:    uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:        uuid('customer_id').notNull().references(() => customers.id),
  clinicalSessionId: uuid('clinical_session_id').references(() => clinicalSessions.id),
  weightKg:          numeric('weight_kg', { precision: 5, scale: 2 }),
  heightCm:          numeric('height_cm', { precision: 5, scale: 1 }),
  waistCm:           numeric('waist_cm', { precision: 5, scale: 1 }),
  hipCm:             numeric('hip_cm', { precision: 5, scale: 1 }),
  bustCm:            numeric('bust_cm', { precision: 5, scale: 1 }),
  armLeftCm:         numeric('arm_left_cm', { precision: 5, scale: 1 }),
  armRightCm:        numeric('arm_right_cm', { precision: 5, scale: 1 }),
  thighLeftCm:       numeric('thigh_left_cm', { precision: 5, scale: 1 }),
  thighRightCm:      numeric('thigh_right_cm', { precision: 5, scale: 1 }),
  measuredAt:        timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── prescriptions ─────────────────────────────────────────────
// 1:1 with clinical_session. adherence updated in the NEXT session.
export const prescriptions = pgTable('prescriptions', {
  id:                        uuid('id').primaryKey().defaultRandom(),
  organizationId:            uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clinicalSessionId:         uuid('clinical_session_id').notNull().unique().references(() => clinicalSessions.id),
  clientAdherence:           adherenceStatusEnum('client_adherence').notNull().default('not_reported'),
  adherenceNotes:            text('adherence_notes'),
  nextAppointmentSuggestion: timestamp('next_appointment_suggestion', { withTimezone: true }),
  nextAppointmentGoal:       text('next_appointment_goal'),
  pdfStoragePath:            text('pdf_storage_path'),
  pdfVersion:                smallint('pdf_version').notNull().default(1),
  emailSentAt:               timestamp('email_sent_at', { withTimezone: true }),
  createdAt:                 timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── prescription_steps ────────────────────────────────────────
// product_name is free text (client uses market products, not clinical ones)
export const prescriptionSteps = pgTable('prescription_steps', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  prescriptionId: uuid('prescription_id').notNull().references(() => prescriptions.id, { onDelete: 'cascade' }),
  period:         prescriptionPeriodEnum('period').notNull(),
  stepOrder:      smallint('step_order').notNull(),
  productName:    text('product_name').notNull(),
  instruction:    text('instruction').notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_prescription_step').on(t.prescriptionId, t.period, t.stepOrder),
]);

export type ClinicalSession = typeof clinicalSessions.$inferSelect;
export type NewClinicalSession = typeof clinicalSessions.$inferInsert;
export type TreatmentCycle = typeof treatmentCycles.$inferSelect;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type SignedDocument = typeof signedDocuments.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type EquipmentCatalog = typeof equipmentCatalog.$inferSelect;
export type ProductCatalog = typeof productCatalog.$inferSelect;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
