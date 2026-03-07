import { Users, Flame, Clock, UserCheck, TrendingUp, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardData } from "@/pages/Index";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** SVG targeting brackets for stat cards — 4 corner L-shapes */
function TargetingBrackets() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {/* Top-left */}
      <line x1="4" y1="8" x2="4" y2="4" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      <line x1="4" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      {/* Top-right */}
      <line x1="100%" y1="4" x2="100%" y2="4" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      <line x1="calc(100% - 4px)" y1="8" x2="calc(100% - 4px)" y2="4" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      <line x1="calc(100% - 4px)" y1="4" x2="calc(100% - 12px)" y2="4" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      {/* Bottom-left */}
      <line x1="4" y1="calc(100% - 8px)" x2="4" y2="calc(100% - 4px)" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      <line x1="4" y1="calc(100% - 4px)" x2="12" y2="calc(100% - 4px)" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      {/* Bottom-right */}
      <line x1="calc(100% - 4px)" y1="calc(100% - 8px)" x2="calc(100% - 4px)" y2="calc(100% - 4px)" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      <line x1="calc(100% - 4px)" y1="calc(100% - 4px)" x2="calc(100% - 12px)" y2="calc(100% - 4px)" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="relative bg-card rounded-card p-5 card-hover border border-primary/5 overflow-hidden group hover:border-primary/15 transition-all">
      <TargetingBrackets />
      <Icon className="h-4 w-4 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-mono font-black text-foreground">{value}</p>
    </div>
  );
}

export function StatsRow({ data }: { data: DashboardData }) {
  const stats: StatCardProps[] = [
    { icon: Users, label: "Total Leads", value: String(data.totalLeads) },
    { icon: Flame, label: "Leads Quentes", value: String(data.leadsQuentes) },
    { icon: Clock, label: "Contatados", value: String(data.contatados) },
    { icon: UserCheck, label: "Pagos", value: String(data.pagos) },
    { icon: TrendingUp, label: "Pipeline", value: `R$ ${(data.pipelineValue / 1000).toFixed(1)}k` },
    { icon: Star, label: "Receita", value: `R$ ${(data.revenue / 1000).toFixed(1)}k` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
