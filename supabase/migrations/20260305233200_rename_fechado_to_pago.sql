
-- Rename 'fechado' status to 'pago' in the enum and existing leads
BEGIN;
  -- Rename the value in the enum
  ALTER TYPE public.lead_status RENAME VALUE 'fechado' TO 'pago';
COMMIT;
