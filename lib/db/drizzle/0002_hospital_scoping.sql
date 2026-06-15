-- Add hospital_id to patients (nullable — no backfill required for existing rows)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients(hospital_id);

-- Staff assignments: maps username → hospital
CREATE TABLE IF NOT EXISTS staff_assignments (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(100) NOT NULL,
  hospital_id VARCHAR(20) NOT NULL,
  role        VARCHAR(50) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_username ON staff_assignments(username);
