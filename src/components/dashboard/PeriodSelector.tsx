import { useRef } from "react";
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
    title?: React.ReactNode;
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
    const monthInputRef = useRef<HTMLInputElement>(null);

    const changeMonth = (offset: number) => {
        if (viewMode === 'range') return;

        const parts = selectedMonth.split('-');
        let year = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);

        if (viewMode === 'month') {
            month += offset;
            if (month > 12) { month = 1; year += 1; }
            if (month < 1) { month = 12; year -= 1; }
        } else {
            year += offset;
        }

        setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
    };

    const formatSelectedDate = () => {
        if (viewMode === 'range') {
            const from = new Date(customRange.from + "T12:00:00").toLocaleDateString('pt-BR');
            const to = new Date(customRange.to + "T12:00:00").toLocaleDateString('pt-BR');
            return `${from} — ${to}`;
        }
        const parts = selectedMonth.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);

        if (viewMode === 'year') {
            return `Ano de ${year}`;
        }

        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNames[month - 1]} de ${year}`;
    };

    const handleMonthTextClick = () => {
        if (monthInputRef.current) {
            (monthInputRef.current as any).showPicker?.();
        }
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
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeMonth(-1); }}
                                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary transition-all active:scale-90"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        )}

                        <div className="relative group text-center min-w-[140px] flex items-center justify-center gap-2">
                            {viewMode === 'range' ? (
                                <>
                                    <div className="relative group/date">
                                        <span className="block text-[11px] font-black uppercase tracking-tight text-foreground transition-all group-hover/date:text-primary cursor-pointer whitespace-nowrap px-1">
                                            {customRange.from.split('-').reverse().join('/')}
                                        </span>
                                        <input
                                            type="date"
                                            value={customRange.from}
                                            onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                        />
                                    </div>
                                    <span className="text-muted-foreground opacity-40 px-0.5">—</span>
                                    <div className="relative group/date">
                                        <span className="block text-[11px] font-black uppercase tracking-tight text-foreground transition-all group-hover/date:text-primary cursor-pointer whitespace-nowrap px-1">
                                            {customRange.to.split('-').reverse().join('/')}
                                        </span>
                                        <input
                                            type="date"
                                            value={customRange.to}
                                            onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span
                                        className="block text-sm font-black uppercase tracking-tight text-foreground transition-all hover:text-primary cursor-pointer whitespace-nowrap"
                                        onClick={handleMonthTextClick}
                                    >
                                        {formatSelectedDate()}
                                    </span>
                                    <input
                                        ref={monthInputRef}
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
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </>
                            )}

                            <p className="absolute -bottom-4 left-0 right-0 text-[8px] font-mono font-black uppercase text-primary/60 tracking-tighter flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {viewMode === 'range' ? 'Editar Datas' : 'Clique para escolher'} <Calendar className="h-2 w-2" />
                            </p>
                        </div>

                        {viewMode !== 'range' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeMonth(1); }}
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
