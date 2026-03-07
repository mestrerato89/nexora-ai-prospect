import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface BdrPerformance {
    id: string;
    name: string;
    totalSalesVolume: number;
    salesCount: number;
}

export function BdrRanking() {
    const [bdrSummaries, setBdrSummaries] = useState<BdrPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                // Fetch profiles and explicitly approved payments for the current month
                const [profilesRes, paymentsRes] = await Promise.all([
                    supabase.from('profiles').select('*'),
                    supabase.from('payments').select('*').eq('status', 'aprovado')
                ]);

                if (profilesRes.error) throw profilesRes.error;
                if (paymentsRes.error) throw paymentsRes.error;

                const users = profilesRes.data || [];
                const payments = paymentsRes.data || [];

                // Filter payments to only include the current month
                const currentMonth = new Date().toISOString().substring(0, 7);
                const currentMonthPayments = payments.filter(p => {
                    const pDate = new Date(p.created_at);
                    return `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}` === currentMonth;
                });

                const summaries = users.map(u => {
                    const bdrSales = currentMonthPayments.filter(p => p.user_id === u.user_id);
                    const totalSalesVolume = bdrSales.reduce((sum, p) => sum + p.amount, 0);

                    return {
                        id: u.user_id,
                        name: u.display_name || u.email || "Usuário Desconhecido",
                        totalSalesVolume,
                        salesCount: bdrSales.length
                    };
                }).filter(summary => summary.totalSalesVolume > 0)
                    .sort((a, b) => b.totalSalesVolume - a.totalSalesVolume); // Sort desc

                setBdrSummaries(summaries);
            } catch (error) {
                console.error("Erro ao buscar ranking de BDRs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    };

    return (
        <Card className="rounded-[2rem] border-primary/10 bg-card/40 backdrop-blur-sm overflow-hidden h-full flex flex-col shadow-xl">
            <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                    Ranking de Vendas (Mês Atual)
                    <Trophy className="h-5 w-5 text-amber-500" />
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col min-h-[300px]">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center animate-pulse">
                        <Users className="h-8 w-8 text-primary/20" />
                    </div>
                ) : bdrSummaries.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40 italic text-center gap-3">
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Nenhum faturamento registrado neste mês ainda.</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bdrSummaries.map((bdr, idx) => (
                            <motion.div
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                key={bdr.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${idx === 0 ? 'bg-amber-500/10 border-amber-500/20 shadow-amber-500/5 ring-1 ring-amber-500/20' : idx === 1 ? 'bg-slate-300/10 border-slate-300/20' : idx === 2 ? 'bg-orange-800/10 border-orange-800/20' : 'bg-background/40 border-border/50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-500 text-white shadow-md' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-800 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {idx + 1}º
                                    </div>
                                    <div className="flex flex-col">
                                        <p className={`font-bold text-sm ${idx === 0 ? 'text-amber-500' : 'text-foreground'}`}>{bdr.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{bdr.salesCount} Vendas Concluídas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={`${idx === 0 ? 'bg-amber-500 text-white hover:bg-amber-600 border-0' : 'bg-primary/10 text-primary border-primary/20'} font-black text-xs px-3 py-1 shadow-sm`}>
                                        R$ {bdr.totalSalesVolume.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                    </Badge>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
