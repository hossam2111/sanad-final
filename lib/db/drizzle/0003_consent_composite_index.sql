-- Replace two single-column indexes with one composite index.
-- getConsentState() always queries WHERE patient_id = ? AND consent_type = ?
-- so a composite index is strictly better than the two separate ones.
DROP INDEX IF EXISTS idx_consent_patient_id;
DROP INDEX IF EXISTS idx_consent_type;
CREATE INDEX IF NOT EXISTS idx_consent_patient_type ON consent_records(patient_id, consent_type);
