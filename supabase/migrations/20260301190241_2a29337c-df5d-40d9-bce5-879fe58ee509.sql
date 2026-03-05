CREATE TABLE IF NOT EXISTS public.prospect_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  location TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(niche, location)
);

ALTER TABLE public.prospect_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prospect cache"
  ON public.prospect_cache FOR SELECT
  USING (true);

CREATE POLICY "Anon can insert prospect cache"
  ON public.prospect_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can update prospect cache"
  ON public.prospect_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_prospect_cache_lookup ON public.prospect_cache (niche, location);