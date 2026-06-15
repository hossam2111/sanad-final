CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"national_id" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" text NOT NULL,
	"blood_type" text NOT NULL,
	"phone" text,
	"emergency_contact" text,
	"emergency_phone" text,
	"chronic_conditions" text[] DEFAULT '{}',
	"allergies" text[] DEFAULT '{}',
	"risk_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "patients_national_id_unique" UNIQUE("national_id")
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"drug_name" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"prescribed_by" text NOT NULL,
	"hospital" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"visit_date" date NOT NULL,
	"hospital" text NOT NULL,
	"department" text NOT NULL,
	"doctor" text NOT NULL,
	"diagnosis" text NOT NULL,
	"notes" text,
	"visit_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"test_name" text NOT NULL,
	"test_date" date NOT NULL,
	"result" text NOT NULL,
	"unit" text,
	"reference_range" text,
	"status" text NOT NULL,
	"hospital" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"risk_score" integer NOT NULL,
	"risk_level" text NOT NULL,
	"urgency" text NOT NULL,
	"primary_action" text NOT NULL,
	"time_window" text NOT NULL,
	"why_factors" jsonb NOT NULL,
	"confidence" real NOT NULL,
	"source" text DEFAULT 'clinical_rules',
	"recommendations" jsonb NOT NULL,
	"digital_twin_projection" jsonb,
	"behavioral_flags" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"patient_id" integer,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp DEFAULT now(),
	"ai_decision_id" integer,
	"source" text DEFAULT 'system'
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"who" text NOT NULL,
	"who_name" text,
	"who_role" text NOT NULL,
	"action" text DEFAULT 'CREATE' NOT NULL,
	"what" text NOT NULL,
	"patient_id" integer,
	"details" jsonb,
	"ai_decision_id" integer,
	"confidence" real,
	"hash" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"consent_type" text NOT NULL,
	"purpose" text NOT NULL,
	"granted_to" text NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"granted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"ip_address" text,
	"user_agent" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"patient_name" text NOT NULL,
	"patient_national_id" text NOT NULL,
	"hospital" text NOT NULL,
	"department" text NOT NULL,
	"service" text,
	"appointment_date" text NOT NULL,
	"appointment_time" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"reference_no" text NOT NULL,
	"notes" text,
	"cancelled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"drug_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"supplier" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"requested_by" text,
	"estimated_delivery" date,
	"total_value" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claim_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"status" text NOT NULL,
	"reviewed_by" text NOT NULL,
	"reviewed_at" timestamp NOT NULL,
	"notes" text,
	"ai_reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "claim_reviews_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "ai_retrain_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"engine" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0,
	"triggered_by" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_decisions" ADD CONSTRAINT "ai_decisions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_patients_risk_score" ON "patients" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "idx_patients_gender" ON "patients" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "idx_medications_patient_id" ON "medications" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_medications_patient_active" ON "medications" USING btree ("patient_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_medications_drug_name" ON "medications" USING btree ("drug_name");--> statement-breakpoint
CREATE INDEX "idx_visits_patient_id" ON "visits" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_visits_patient_date" ON "visits" USING btree ("patient_id","visit_date");--> statement-breakpoint
CREATE INDEX "idx_visits_date" ON "visits" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX "idx_lab_results_patient_id" ON "lab_results" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_lab_results_patient_date" ON "lab_results" USING btree ("patient_id","test_date");--> statement-breakpoint
CREATE INDEX "idx_lab_results_status" ON "lab_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_alerts_patient_id" ON "alerts" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_unread" ON "alerts" USING btree ("is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_alerts_severity" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_ai_decisions_patient_id" ON "ai_decisions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_ai_decisions_patient_created" ON "ai_decisions" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_decisions_urgency" ON "ai_decisions" USING btree ("urgency");--> statement-breakpoint
CREATE INDEX "idx_events_patient_id" ON "events" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_events_event_type" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_events_processed_at" ON "events" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "idx_audit_patient_created" ON "audit_log" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_who_created" ON "audit_log" USING btree ("who","created_at");--> statement-breakpoint
CREATE INDEX "idx_consent_patient_id" ON "consent_records" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_consent_type" ON "consent_records" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "idx_appointments_patient_id" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_date" ON "appointments" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "idx_appointments_status" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_status" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_purchase_orders_created" ON "purchase_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_claim_reviews_claim_id" ON "claim_reviews" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "idx_claim_reviews_status" ON "claim_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retrain_jobs_engine" ON "ai_retrain_jobs" USING btree ("engine");--> statement-breakpoint
CREATE INDEX "idx_retrain_jobs_status" ON "ai_retrain_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_retrain_jobs_created" ON "ai_retrain_jobs" USING btree ("created_at");