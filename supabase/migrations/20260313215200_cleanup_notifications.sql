-- Deleta notificações com mais de 3 dias
DELETE FROM public.notifications 
WHERE created_at < now() - interval '3 days';

-- Adiciona política para permitir que o sistema/usuário limpe notificações antigas via código se necessário
DROP POLICY IF EXISTS "Users can delete their own old notifications" ON public.notifications;
CREATE POLICY "Users can delete their own old notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

-- Opcional: Se quiser usar o pg_cron para automação total no servidor (Recomendado)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-old-notifications', '0 0 * * *', $$ DELETE FROM public.notifications WHERE created_at < now() - interval '3 days' $$);
