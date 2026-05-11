CREATE TYPE "public"."adherence_status" AS ENUM('followed', 'partial', 'not_followed', 'not_reported');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."block_reason" AS ENUM('vacation', 'illness', 'training', 'other');--> statement-breakpoint
CREATE TYPE "public"."calendar_provider" AS ENUM('google', 'microsoft', 'apple');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'textarea', 'select', 'checkbox', 'date', 'phone');--> statement-breakpoint
CREATE TYPE "public"."cycle_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('informed_consent', 'clinical_evaluation');--> statement-breakpoint
CREATE TYPE "public"."hydration_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('instagram', 'facebook', 'stripe', 'google_reviews', 'mailchimp', 'google_analytics', 'google_tag_manager', 'zapier', 'reserve_with_google');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error', 'pending');--> statement-breakpoint
CREATE TYPE "public"."invasiveness_level" AS ENUM('low', 'medium', 'high', 'invasive');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."notification_target" AS ENUM('team', 'client');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."prescription_period" AS ENUM('morning', 'night', 'both');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."reminder_unit" AS ENUM('minutes', 'hours', 'days', 'weeks', 'months');--> statement-breakpoint
CREATE TYPE "public"."session_photo_type" AS ENUM('before', 'after', 'progress');--> statement-breakpoint
CREATE TYPE "public"."severity_level" AS ENUM('mild', 'moderate', 'severe');--> statement-breakpoint
CREATE TYPE "public"."skin_texture" AS ENUM('fine', 'medium', 'thick');--> statement-breakpoint
CREATE TYPE "public"."skin_type" AS ENUM('dry', 'oily', 'mixed', 'normal', 'sensitive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'owner', 'staff');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"tax_id" text,
	"timezone" text DEFAULT 'Europe/Lisbon' NOT NULL,
	"locale" text DEFAULT 'pt' NOT NULL,
	"theme_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stripe_account_id" text,
	"stripe_onboarded" boolean DEFAULT false NOT NULL,
	"stripe_charges_enabled" boolean DEFAULT false NOT NULL,
	"custom_redirect_url" text,
	"auto_redirect" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"address" text,
	"logo_url" text,
	"thank_you_url" text,
	"banner_url" text,
	"industry" text,
	"about" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"default_currency" text DEFAULT 'EUR' NOT NULL,
	"primary_email" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"phone" text,
	"locale" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"name_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" text,
	"slug" text,
	"invasiveness_level" "invasiveness_level" DEFAULT 'low' NOT NULL,
	"cover_image_url" text,
	"deposit_percent" smallint DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"birth_date" date,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"is_smoker" boolean DEFAULT false NOT NULL,
	"is_pregnant" boolean DEFAULT false NOT NULL,
	"pregnancy_due_date" date,
	"allergies" text,
	"medications" text,
	"chronic_conditions" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_onboarding_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "customer_skin_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"skin_condition_id" uuid NOT NULL,
	"detected_at" date,
	"resolved_at" date,
	"severity" "severity_level",
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_skin_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"fitzpatrick_type" smallint,
	"skin_type" "skin_type",
	"hydration_level" "hydration_level",
	"texture" "skin_texture",
	"notes" text,
	"last_evaluated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_skin_profile_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"email" text,
	"is_guest" boolean DEFAULT false NOT NULL,
	"notes" text,
	"client_status" text DEFAULT 'nuevo' NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"avatar_url" text,
	"company" text,
	"country" text,
	"country_iso" text,
	"address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skin_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_skin_condition_slug" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_profile_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_id" text,
	"coupon_id" uuid,
	"price_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"surcharges_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"guest_comment" text,
	"policy_accepted_at" timestamp with time zone,
	"review_request_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_custom_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"label" text NOT NULL,
	"field_type" "custom_field_type" DEFAULT 'text' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"options" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"allow_same_day_booking" boolean DEFAULT false NOT NULL,
	"booking_window_days" integer DEFAULT 60 NOT NULL,
	"thank_you_url" text,
	"redirect_after_payment" boolean DEFAULT true NOT NULL,
	"cancellation_policy_text" text,
	"cancellation_hours_notice" integer DEFAULT 24 NOT NULL,
	"online_payment_enabled" boolean DEFAULT false NOT NULL,
	"advance_payment_required" boolean DEFAULT false NOT NULL,
	"first_available_slot" boolean DEFAULT false NOT NULL,
	"skip_team_member" boolean DEFAULT false NOT NULL,
	"allow_multiple_services" boolean DEFAULT false NOT NULL,
	"any_team_member_allowed" boolean DEFAULT true NOT NULL,
	"client_login_enabled" boolean DEFAULT false NOT NULL,
	"allow_online_rescheduling" boolean DEFAULT false NOT NULL,
	"allow_online_cancellation" boolean DEFAULT true NOT NULL,
	"show_rebook_button" boolean DEFAULT true NOT NULL,
	"form_field_name" boolean DEFAULT true NOT NULL,
	"form_field_phone" boolean DEFAULT true NOT NULL,
	"form_field_email" boolean DEFAULT true NOT NULL,
	"form_field_address" boolean DEFAULT false NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"booking_lead_time_hours" integer DEFAULT 4 NOT NULL,
	"client_login_required" boolean DEFAULT false NOT NULL,
	"accordion_view" boolean DEFAULT true NOT NULL,
	"show_service_prices" boolean DEFAULT true NOT NULL,
	"show_service_duration" boolean DEFAULT true NOT NULL,
	"show_working_hours" boolean DEFAULT true NOT NULL,
	"show_local_time" boolean DEFAULT false NOT NULL,
	"terms_label" text,
	"terms_url" text,
	"terms_required" boolean DEFAULT false NOT NULL,
	"redirect_label" text,
	"redirect_url" text,
	"show_in_search_results" boolean DEFAULT true NOT NULL,
	"preferred_language" text DEFAULT 'pt' NOT NULL,
	"time_format" text DEFAULT '24h' NOT NULL,
	"week_start_day" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_coupon_per_appointment" UNIQUE("coupon_id","appointment_id")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"valid_from" date NOT NULL,
	"valid_until" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_coupon_code_per_org" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "payment_surcharges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"value_type" "discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"is_reduction" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temporary_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"slot_start" timestamp with time zone NOT NULL,
	"slot_end" timestamp with time zone NOT NULL,
	"locked_by_session" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"clinical_session_id" uuid,
	"weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 1),
	"waist_cm" numeric(5, 1),
	"hip_cm" numeric(5, 1),
	"bust_cm" numeric(5, 1),
	"arm_left_cm" numeric(5, 1),
	"arm_right_cm" numeric(5, 1),
	"thigh_left_cm" numeric(5, 1),
	"thigh_right_cm" numeric(5, 1),
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"treatment_cycle_id" uuid,
	"skin_reaction_notes" text,
	"professional_notes" text,
	"created_by_profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinical_sessions_appointment_id_unique" UNIQUE("appointment_id")
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"invasiveness_level" "invasiveness_level",
	"title" text NOT NULL,
	"content_html" text NOT NULL,
	"version" smallint DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category" text,
	"params_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facial_zone_annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"clinical_session_id" uuid,
	"zone_key" text NOT NULL,
	"annotation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"period" "prescription_period" NOT NULL,
	"step_order" smallint NOT NULL,
	"product_name" text NOT NULL,
	"instruction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_prescription_step" UNIQUE("prescription_id","period","step_order")
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clinical_session_id" uuid NOT NULL,
	"client_adherence" "adherence_status" DEFAULT 'not_reported' NOT NULL,
	"adherence_notes" text,
	"next_appointment_suggestion" timestamp with time zone,
	"next_appointment_goal" text,
	"pdf_storage_path" text,
	"pdf_version" smallint DEFAULT 1 NOT NULL,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prescriptions_clinical_session_id_unique" UNIQUE("clinical_session_id")
);
--> statement-breakpoint
CREATE TABLE "product_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_equipment_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clinical_session_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"params_used" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"duration_minutes" smallint,
	"zone_applied" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clinical_session_id" uuid NOT NULL,
	"photo_type" "session_photo_type" NOT NULL,
	"storage_path" text NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_products_used" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clinical_session_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity_used" text,
	"application_zone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signed_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"document_template_id" uuid NOT NULL,
	"appointment_id" uuid,
	"treatment_cycle_id" uuid,
	"professional_profile_id" uuid NOT NULL,
	"professional_signature_data" text NOT NULL,
	"professional_signed_at" timestamp with time zone NOT NULL,
	"client_signature_data" text,
	"client_signed_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"invalidated_reason" text,
	"pdf_storage_path" text,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatment_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"title" text NOT NULL,
	"goal" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"status" "cycle_status" DEFAULT 'active' NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid,
	"day_of_week" smallint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"break_start" time,
	"break_end" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_intervals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"reason" "block_reason" DEFAULT 'other' NOT NULL,
	"title" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"recurrence_type" "recurrence_type" DEFAULT 'none' NOT NULL,
	"recurrence_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" "calendar_provider" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"calendar_id" text NOT NULL,
	"calendar_name" text,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"external_event_id" text NOT NULL,
	"title" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"is_blocking" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"invited_by" uuid,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "google_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"google_review_id" text NOT NULL,
	"reviewer_name" text,
	"reviewer_photo_url" text,
	"rating" smallint NOT NULL,
	"comment" text,
	"published_at" timestamp with time zone NOT NULL,
	"reply_text" text,
	"replied_at" timestamp with time zone,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"target" "notification_target" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"timing_value" smallint NOT NULL,
	"timing_unit" "reminder_unit" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_notify_confirmation" boolean DEFAULT true NOT NULL,
	"team_notify_alteration" boolean DEFAULT true NOT NULL,
	"team_notify_cancellation" boolean DEFAULT true NOT NULL,
	"client_notify_confirmation" boolean DEFAULT true NOT NULL,
	"client_notify_alteration" boolean DEFAULT true NOT NULL,
	"client_notify_cancellation" boolean DEFAULT true NOT NULL,
	"sender_name" text,
	"email_signature" text,
	"review_request_enabled" boolean DEFAULT true NOT NULL,
	"review_request_delay_value" smallint DEFAULT 4 NOT NULL,
	"review_request_delay_unit" "reminder_unit" DEFAULT 'hours' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"status" "integration_status" DEFAULT 'disconnected' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"connected_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_gallery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_phones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"label" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"title" text DEFAULT 'Home Care Routine' NOT NULL,
	"morning_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"afternoon_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"night_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specialist_notes" text,
	"pdf_storage_path" text,
	"pdf_version" smallint DEFAULT 1 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_categories" ADD CONSTRAINT "catalog_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_services" ADD CONSTRAINT "catalog_services_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_services" ADD CONSTRAINT "catalog_services_category_id_catalog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."catalog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff" ADD CONSTRAINT "service_staff_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_onboarding" ADD CONSTRAINT "customer_onboarding_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_onboarding" ADD CONSTRAINT "customer_onboarding_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_skin_conditions" ADD CONSTRAINT "customer_skin_conditions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_skin_conditions" ADD CONSTRAINT "customer_skin_conditions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_skin_conditions" ADD CONSTRAINT "customer_skin_conditions_skin_condition_id_skin_conditions_id_fk" FOREIGN KEY ("skin_condition_id") REFERENCES "public"."skin_conditions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_skin_profile" ADD CONSTRAINT "customer_skin_profile_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_skin_profile" ADD CONSTRAINT "customer_skin_profile_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skin_conditions" ADD CONSTRAINT "skin_conditions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_profile_id_profiles_id_fk" FOREIGN KEY ("staff_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_custom_fields" ADD CONSTRAINT "booking_custom_fields_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD CONSTRAINT "booking_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_surcharges" ADD CONSTRAINT "payment_surcharges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_slots" ADD CONSTRAINT "temporary_slots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temporary_slots" ADD CONSTRAINT "temporary_slots_service_id_catalog_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."catalog_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_clinical_session_id_clinical_sessions_id_fk" FOREIGN KEY ("clinical_session_id") REFERENCES "public"."clinical_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_treatment_cycle_id_treatment_cycles_id_fk" FOREIGN KEY ("treatment_cycle_id") REFERENCES "public"."treatment_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_created_by_profile_id_profiles_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_catalog" ADD CONSTRAINT "equipment_catalog_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facial_zone_annotations" ADD CONSTRAINT "facial_zone_annotations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facial_zone_annotations" ADD CONSTRAINT "facial_zone_annotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facial_zone_annotations" ADD CONSTRAINT "facial_zone_annotations_clinical_session_id_clinical_sessions_id_fk" FOREIGN KEY ("clinical_session_id") REFERENCES "public"."clinical_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_steps" ADD CONSTRAINT "prescription_steps_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_steps" ADD CONSTRAINT "prescription_steps_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_clinical_session_id_clinical_sessions_id_fk" FOREIGN KEY ("clinical_session_id") REFERENCES "public"."clinical_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_catalog" ADD CONSTRAINT "product_catalog_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_equipment_log" ADD CONSTRAINT "session_equipment_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_equipment_log" ADD CONSTRAINT "session_equipment_log_clinical_session_id_clinical_sessions_id_fk" FOREIGN KEY ("clinical_session_id") REFERENCES "public"."clinical_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_equipment_log" ADD CONSTRAINT "session_equipment_log_equipment_id_equipment_catalog_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_photos" ADD CONSTRAINT "session_photos_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_photos" ADD CONSTRAINT "session_photos_clinical_session_id_clinical_sessions_id_fk" FOREIGN KEY ("clinical_session_id") REFERENCES "public"."clinical_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_products_used" ADD CONSTRAINT "session_products_used_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_products_used" ADD CONSTRAINT "session_products_used_clinical_session_id_clinical_sessions_id_fk" FOREIGN KEY ("clinical_session_id") REFERENCES "public"."clinical_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_products_used" ADD CONSTRAINT "session_products_used_product_id_product_catalog_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "signed_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "signed_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "signed_documents_document_template_id_document_templates_id_fk" FOREIGN KEY ("document_template_id") REFERENCES "public"."document_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "signed_documents_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "signed_documents_treatment_cycle_id_treatment_cycles_id_fk" FOREIGN KEY ("treatment_cycle_id") REFERENCES "public"."treatment_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_documents" ADD CONSTRAINT "signed_documents_professional_profile_id_profiles_id_fk" FOREIGN KEY ("professional_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_cycles" ADD CONSTRAINT "treatment_cycles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_cycles" ADD CONSTRAINT "treatment_cycles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_cycles" ADD CONSTRAINT "treatment_cycles_created_by_profile_id_profiles_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_intervals" ADD CONSTRAINT "blocked_intervals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_intervals" ADD CONSTRAINT "blocked_intervals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_integration_id_calendar_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."calendar_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_calendar_events" ADD CONSTRAINT "external_calendar_events_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_reviews" ADD CONSTRAINT "google_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminders" ADD CONSTRAINT "notification_reminders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_integrations" ADD CONSTRAINT "org_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_gallery" ADD CONSTRAINT "organization_gallery_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_phones" ADD CONSTRAINT "organization_phones_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_routines" ADD CONSTRAINT "customer_routines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_routines" ADD CONSTRAINT "customer_routines_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_routines" ADD CONSTRAINT "customer_routines_created_by_profile_id_profiles_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_catalog_categories_org_id" ON "catalog_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_catalog_services_org_id" ON "catalog_services" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customers_org_id" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_org_id" ON "appointments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_customer_id" ON "appointments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_start_at" ON "appointments" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "idx_payments_org_id" ON "payments" USING btree ("organization_id");