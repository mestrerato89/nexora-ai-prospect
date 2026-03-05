
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
