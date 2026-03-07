import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface PeriodSelectorProps {
    viewMode: 'month' | 'year' | 'range';
    setViewMode: (mode: 'month' | 'year' | 'range') => void;
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    customRange: { from: string; to: string };
    setCustomRange: (range: { from: string; to: string }) => void;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

export function PeriodSelector({
    viewMode,
    setViewMode,
    selectedMonth,
    setSelectedMonth,
    customRange,
    setCustomRange,
    title = "Gestão de Operações",
    subtitle = "Visão Geral e Métricas",
    icon
}: PeriodSelectorProps) {
    const changeMonth = (offset: number) => {
        if (viewMode === 'range') return;
        const date = new Date(selectedMonth + "-01");
        if (viewMode === 'month') {
            date.setMonth(date.getMonth() + offset);
        } else {
            date.setFullYear(date.getFullYear() + offset);
        }
        setSelectedMonth(date.toISOString().substring(0, 7));
    };

    const formatSelectedDate = () => {
        if (viewMode === 'range') {
            const from = new Date(customRange.from).toLocaleDateString('pt-BR');
            const to = new Date(customRange.to).toLocaleDateString('pt-BR');
            return `${from} — ${to}`;
        }
        const date = new Date(selectedMonth + "-15");
        if (viewMode === 'year') {
            return `Ano de ${date.getFullYear()}`;
        }
        // Capitalize first letter of month
        const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    return (
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-[2rem] blur-2xl -z-10" />
            <div className="bg-card/40 backdrop-blur-xl border border-primary/10 rounded-[2rem] p-4 lg:p-6 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/5">
                <div className="flex items-center gap-4">
                    {icon && (
                        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                            {title}
                            <Badge className="bg-primary/20 text-primary border-0 text-[8px] font-black uppercase px-2 py-0 h-4">ATIVO</Badge>
                        </h2>
                        <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest opacity-60 line-clamp-1">{subtitle}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 bg-muted/30 p-1.5 rounded-3xl border border-primary/5">
                    <div className="flex p-1 bg-background/40 rounded-2xl border border-primary/5 shadow-inner">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => setViewMode('year')}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Ano
                        </button>
                        <button
                            onClick={() => setViewMode('range')}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'range' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Período
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-primary/10 hidden md:block mx-1" />

                    <div className="flex items-center gap-3 px-2">
                        {viewMode !== 'range' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary transition-all active:scale-90"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        )}

                        <div className="relative group text-center min-w-[140px] flex items-center justify-center gap-2">
                            {viewMode === 'range' ? (
                                <>
                                    <div className="relative">
                                        <span className="block text-[11px] font-black uppercase tracking-tight text-foreground transition-all hover:text-primary cursor-pointer whitespace-nowrap">
                                            {new Date(customRange.from).toLocaleDateString('pt-BR')}
                                        </span>
                                        <input
                                            type="date"
                                            value={customRange.from}
                                            onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-muted-foreground opacity-40 px-1">—</span>
                                    <div className="relative">
                                        <span className="block text-[11px] font-black uppercase tracking-tight text-foreground transition-all hover:text-primary cursor-pointer whitespace-nowrap">
                                            {new Date(customRange.to).toLocaleDateString('pt-BR')}
                                        </span>
                                        <input
                                            type="date"
                                            value={customRange.to}
                                            onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="block text-sm font-black uppercase tracking-tight text-foreground transition-all group-hover:text-primary cursor-default whitespace-nowrap">
                                        {formatSelectedDate()}
                                    </span>
                                    <input
                                        type={viewMode === 'month' ? "month" : "number"}
                                        value={viewMode === 'month' ? selectedMonth : selectedMonth.split('-')[0]}
                                        onChange={(e) => {
                                            if (viewMode === 'year') {
                                                setSelectedMonth(`${e.target.value}-01`);
                                            } else {
                                                setSelectedMonth(e.target.value);
                                            }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </>
                            )}

                            <p className="absolute -bottom-4 left-0 right-0 text-[8px] font-mono font-black uppercase text-primary/60 tracking-tighter flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {viewMode === 'range' ? 'Editar Datas' : 'Alterar Período'} <Calendar className="h-2 w-2" />
                            </p>
                        </div>

                        {viewMode !== 'range' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary transition-all active:scale-90"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
