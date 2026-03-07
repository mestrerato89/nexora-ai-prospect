-- Tabela para pagamentos dos leads (relacionada com leads existentes)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado')),
    include_head BOOLEAN NOT NULL DEFAULT true,
    include_bdr BOOLEAN NOT NULL DEFAULT true,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para gastos/despesas do mês
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('fixo', 'variavel')),
    name TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para Recorrências (Subscriptions) - Somente Admin (lucro 100% da empresa)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado')),
    start_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativando as regras de segurança do Supabase (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Only admins/heads can manage payments" ON public.payments FOR ALL TO authenticated USING ((SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) IN ('admin', 'head_operacional'));
CREATE POLICY "Only admins/heads can manage expenses" ON public.expenses FOR ALL TO authenticated USING ((SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) IN ('admin', 'head_operacional'));
CREATE POLICY "Only admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING ((SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin');
