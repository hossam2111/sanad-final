-- Hospital-scoped patient queries: WHERE hospital_id = ? [AND risk_score >= ?]
-- Used by the hospital overview endpoint to scope patients to a specific facility.
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
