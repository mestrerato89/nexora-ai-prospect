-- Add 'negociando' to lead_status enum
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'negociando';

-- Migrate old statuses to negociando
UPDATE public.leads SET status = 'negociando' WHERE status IN ('agendado', 'reuniao', 'proposta');
