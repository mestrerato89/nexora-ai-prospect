import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface BdrPerformance {
    id: string;
    name: string;
    totalSalesVolume: number;
    salesCount: number;
}

/** SVG crown for 1st place — 3 triangles */
function CrownIcon() {
    return (
        <svg width="14" height="10" viewBox="0 0 14 10" className="text-primary">
            <polygon points="0,8 2,2 4,6" fill="currentColor" />
            <polygon points="4,6 7,0 10,6" fill="currentColor" />
            <polygon points="10,6 12,2 14,8" fill="currentColor" />
            <rect x="0" y="8" width="14" height="2" rx="1" fill="currentColor" />
        </svg>
    );
}

interface BdrRankingProps {
    selectedMonth: string;
    viewMode: 'month' | 'year' | 'range';
    customRange: { from: string; to: string };
}

export function BdrRanking({ selectedMonth, viewMode, customRange }: BdrRankingProps) {
    const [bdrSummaries, setBdrSummaries] = useState<BdrPerformance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                setLoading(true);
                const [profilesRes, paymentsRes] = await Promise.all([
                    supabase.from('profiles').select('*'),
                    supabase.from('payments').select('*').eq('status', 'aprovado')
                ]);

                if (profilesRes.error) throw profilesRes.error;
                if (paymentsRes.error) throw paymentsRes.error;

                const users = profilesRes.data || [];
                const payments = paymentsRes.data || [];

                let start = new Date(selectedMonth + "-01T12:00:00");
                let end = new Date(selectedMonth + "-01T12:00:00");

                if (viewMode === 'month') {
                    end.setMonth(end.getMonth() + 1);
                } else if (viewMode === 'year') {
                    start.setMonth(0);
                    end.setFullYear(end.getFullYear() + 1);
                    end.setMonth(0);
                } else {
                    start = new Date(customRange.from + "T00:00:00");
                    end = new Date(customRange.to + "T23:59:59");
                }

                const periodPayments = payments.filter(p => {
                    const pDate = new Date(p.created_at);
                    return pDate >= start && pDate <= end;
                });

                const summaries = users.map(u => {
                    const bdrSales = periodPayments.filter(p => p.user_id === u.user_id);
                    const totalSalesVolume = bdrSales.reduce((sum, p) => sum + Number(p.amount), 0);
                    return {
                        id: u.user_id,
                        name: u.display_name || u.email || "Desconhecido",
                        totalSalesVolume,
                        salesCount: bdrSales.length
                    };
                }).filter(s => s.totalSalesVolume > 0)
                    .sort((a, b) => b.totalSalesVolume - a.totalSalesVolume);

                setBdrSummaries(summaries);
            } catch (error) {
                console.error("Erro ranking BDR:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, [selectedMonth, viewMode, customRange]);

    const maxVolume = bdrSummaries.length > 0 ? bdrSummaries[0].totalSalesVolume : 1;

    return (
        <Card className="rounded-card border-primary/5 bg-card overflow-hidden h-full flex flex-col">
            <CardHeader className="p-5 border-b border-primary/5">
                <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
                    Ranking Vendas
                    <span className="text-[9px] font-mono text-primary/50 uppercase">
                        {viewMode === 'month' ? new Date(selectedMonth + "-15").toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) :
                            viewMode === 'year' ? `Ano ${selectedMonth.split('-')[0]}` : 'Período'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col min-h-[280px]">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : bdrSummaries.length === 0 ? (
                    /* Empty state — radar */
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-[100px] h-[100px]">
                            <svg width="100" height="100" viewBox="0 0 100 100" className="text-primary">
                                <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.08" />
                                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.06" />
                                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.04" />
                                <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" opacity="0.05" />
                                <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.05" />
                            </svg>
                            <div className="absolute inset-0 animate-radar-sweep origin-center">
                                <svg width="100" height="100" viewBox="0 0 100 100">
                                    <line x1="50" y1="50" x2="50" y2="8" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Nenhum sinal detectado</span>
                    </div>
                ) : (
                    <div className="space-y-3 flex-1">
                        {bdrSummaries.map((bdr, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={bdr.id}
                                className="flex items-center gap-3"
                            >
                                {/* Position */}
                                <div className="flex items-center gap-1 w-8 shrink-0">
                                    {idx === 0 && <CrownIcon />}
                                    <span className={`font-mono font-black text-sm ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Name + sales count */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold truncate ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{bdr.name}</p>
                                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{bdr.salesCount} vendas</p>
                                </div>

                                {/* Ammo bar + value */}
                                <div className="flex items-center gap-2 w-[140px] shrink-0">
                                    <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(bdr.totalSalesVolume / maxVolume) * 100}%` }}
                                            transition={{ duration: 0.8, delay: idx * 0.15 }}
                                            className={`h-full rounded-full ${idx === 0 ? 'bg-primary' : 'bg-primary/50'}`}
                                        />
                                    </div>
                                    <span className="font-mono text-[11px] font-bold text-foreground shrink-0">
                                        R$ {bdr.totalSalesVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
