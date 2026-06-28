-- Availability-check query: WHERE appointment_date = ? AND hospital = ? AND department = ? AND status = 'confirmed'
-- The old single-column indexes couldn't cover this 4-column predicate together.
-- The composite covers the 3 high-cardinality columns; status is appended as a partial condition.
DROP INDEX IF EXISTS idx_appointments_date;
DROP INDEX IF EXISTS idx_appointments_status;
CREATE INDEX IF NOT EXISTS idx_appointments_avail_check
  ON appointments(appointment_date, hospital, department)
  WHERE status = 'confirmed';
