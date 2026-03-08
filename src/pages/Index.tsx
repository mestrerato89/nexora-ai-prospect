import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { PendingFollowUps } from "@/components/dashboard/PendingFollowUps";
import { QuickProspection } from "@/components/dashboard/QuickProspection";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { NewsSection } from "@/components/dashboard/NewsSection";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { BdrRanking } from "@/components/dashboard/BdrRanking";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { LayoutDashboard, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format as formatDate, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia 👋";
  if (h < 18) return "Boa tarde 👋";
  return "Boa noite 👋";
}

export interface DashboardData {
  totalLeads: number;
  leadsQuentes: number;
  contatados: number;
  pagos: number;
  perdidos: number;
  novos: number;
  proposta: number;
  withPhone: number;
  withWebsite: number;
  avgRating: string;
  pendingFollowUps: number;
  overdueFollowUps: number;
  topNiches: { niche: string; count: number }[];
  followUpsList: { id: string; title: string; due_date: string; lead_id: string | null; completed: boolean }[];
  salesByDay: { date: string; count: number }[];
  revenue: number;
  pipelineValue: number;
}

const Index = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalLeads: 0, leadsQuentes: 0, contatados: 0, pagos: 0, perdidos: 0,
    novos: 0, proposta: 0,
    withPhone: 0, withWebsite: 0, avgRating: "—", pendingFollowUps: 0,
    overdueFollowUps: 0, topNiches: [], followUpsList: [], salesByDay: [],
    revenue: 0, pipelineValue: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'range'>('month');
  const [customRange, setCustomRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name?: string, role?: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
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

      const [leadsRes, followUpsRes, paymentsRes, profileRes] = await Promise.all([
        supabase.from("leads")
          .select("*"),
        supabase.from("follow_ups")
          .select("*")
          .eq("user_id", user.id)
          .eq("completed", false)
          .order("due_date", { ascending: true })
          .limit(10),
        supabase.from("payments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "aprovado"),
        supabase.from("profiles")
          .select("display_name, role")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      const leads = leadsRes.data || [];
      const followUps = followUpsRes.data || [];
      const payments = paymentsRes.data || [];
      if (profileRes.data) setProfile(profileRes.data);
      const now = new Date();

      // Filter leads by the selected period for the stats cards
      const filteredLeads = leads.filter(l => {
        const lDate = new Date(l.created_at);
        return lDate >= start && lDate <= end;
      });

      const nicheMap: Record<string, number> = {};
      filteredLeads.forEach((l) => { if (l.niche) nicheMap[l.niche] = (nicheMap[l.niche] || 0) + 1; });
      const topNiches = Object.entries(nicheMap)
        .map(([niche, count]) => ({ niche, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const ratings = filteredLeads.filter((l) => l.rating != null).map((l) => Number(l.rating));
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "—";

      // Chart data: Only APPROVED payments in the specific period
      const dayMap: Record<string, number> = {};
      const filteredPayments = payments.filter(p => {
        const pDate = new Date(p.created_at);
        return pDate >= start && pDate <= end;
      });

      if (viewMode === 'month') {
        const days = eachDayOfInterval({
          start: startOfMonth(start),
          end: endOfMonth(start)
        });
        days.forEach(d => {
          dayMap[formatDate(d, 'yyyy-MM-dd')] = 0;
        });
        filteredPayments.forEach((p) => {
          const day = p.created_at.slice(0, 10);
          if (dayMap[day] !== undefined) dayMap[day]++;
        });
      } else if (viewMode === 'year') {
        const months = eachMonthOfInterval({
          start: startOfYear(start),
          end: endOfYear(start)
        });
        months.forEach(m => {
          dayMap[formatDate(m, 'yyyy-MM')] = 0;
        });
        filteredPayments.forEach((p) => {
          const month = p.created_at.slice(0, 7);
          if (dayMap[month] !== undefined) dayMap[month]++;
        });
      } else {
        const days = eachDayOfInterval({ start, end });
        days.forEach(d => {
          dayMap[formatDate(d, 'yyyy-MM-dd')] = 0;
        });
        filteredPayments.forEach((p) => {
          const day = p.created_at.slice(0, 10);
          if (dayMap[day] !== undefined) dayMap[day]++;
        });
      }

      const salesByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

      const revenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pipelineValue = filteredLeads.filter(l => l.status === 'negociando').length * 1500; // Estimated ticket
      const novos = filteredLeads.filter((l) => l.status === "novo").length;
      const negociando = filteredLeads.filter((l) => l.status === "negociando").length;

      setData({
        totalLeads: filteredLeads.length,
        leadsQuentes: filteredLeads.filter((l) => l.status === "contatado").length,
        contatados: filteredLeads.filter((l) => l.status === "contatado" || l.status === "negociando").length,
        pagos: filteredLeads.filter((l) => l.status === "pago").length,
        perdidos: filteredLeads.filter((l) => l.status === "perdido").length,
        novos, proposta: negociando,
        withPhone: filteredLeads.filter((l) => l.has_phone).length,
        withWebsite: filteredLeads.filter((l) => l.has_website).length,
        avgRating,
        pendingFollowUps: followUps.length,
        overdueFollowUps: followUps.filter((f) => new Date(f.due_date) < now).length,
        topNiches,
        followUpsList: followUps.map((f) => ({ id: f.id, title: f.title, due_date: f.due_date, lead_id: f.lead_id, completed: f.completed })),
        salesByDay,
        revenue,
        pipelineValue,
      });
      setLoading(false);
    };

    fetchData();
  }, [user, selectedMonth, viewMode, customRange]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  const roleDisplay = profile?.role === 'admin' ? 'Admin' : profile?.role === 'head_operacional' ? 'Head Comercial' : 'BDR';
  const nameDisplay = profile?.display_name ? ` ${profile.display_name.split(' ')[0]}` : '';
  const greetingText = (
    <div className="flex items-center gap-2">
      {getGreeting().replace(' 👋', '')}{nameDisplay}
      <Badge
        variant={profile?.role === 'admin' ? "default" : profile?.role === 'head_operacional' ? "outline" : "secondary"}
        className={profile?.role === 'head_operacional' ? "border-primary text-primary" : ""}
      >
        {roleDisplay}
      </Badge>
      👋
    </div>
  );

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6 max-w-[1400px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <PeriodSelector
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            customRange={customRange}
            setCustomRange={setCustomRange}
            title={greetingText}
            subtitle="Painel de operações ativo — Rataria AI"
            icon={<LayoutDashboard className="h-6 w-6 text-primary" />}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsRow data={data} />
        </motion.div>

        {/* Main grid: chart + pipeline + ranking */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-2">
            <PerformanceChart data={data.salesByDay} viewMode={viewMode} />
          </div>
          <div className="xl:col-span-1">
            <PipelineFunnel data={data} />
          </div>
          <div className="xl:col-span-1">
            <BdrRanking selectedMonth={selectedMonth} viewMode={viewMode} customRange={customRange} />
          </div>
        </motion.div>

        {/* Second row: follow-ups + quick prospection */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PendingFollowUps followUps={data.followUpsList} userId={user?.id} />
          <QuickProspection />
        </motion.div>

        <motion.div variants={itemVariants}>
          <NewsSection />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Index;
