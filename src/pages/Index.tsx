import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
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
  leadsByDay: { date: string; count: number }[];
}

const Index = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalLeads: 0, leadsQuentes: 0, contatados: 0, pagos: 0, perdidos: 0,
    novos: 0, proposta: 0,
    withPhone: 0, withWebsite: 0, avgRating: "—", pendingFollowUps: 0,
    overdueFollowUps: 0, topNiches: [], followUpsList: [], leadsByDay: [],
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'range'>('month');
  const [customRange, setCustomRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      let start = new Date(selectedMonth + "-01");
      let end = new Date(selectedMonth + "-01");

      if (viewMode === 'month') {
        end.setMonth(end.getMonth() + 1);
      } else if (viewMode === 'year') {
        start.setMonth(0);
        end.setFullYear(end.getFullYear() + 1);
        end.setMonth(0);
      } else {
        start = new Date(customRange.from);
        end = new Date(customRange.to);
        end.setHours(23, 59, 59, 999);
      }

      const [leadsRes, followUpsRes] = await Promise.all([
        supabase.from("leads")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString()),
        supabase.from("follow_ups")
          .select("*")
          .eq("user_id", user.id)
          .eq("completed", false)
          .order("due_date", { ascending: true })
          .limit(10),
      ]);

      const leads = leadsRes.data || [];
      const followUps = followUpsRes.data || [];
      const now = new Date();

      const nicheMap: Record<string, number> = {};
      leads.forEach((l) => { if (l.niche) nicheMap[l.niche] = (nicheMap[l.niche] || 0) + 1; });
      const topNiches = Object.entries(nicheMap)
        .map(([niche, count]) => ({ niche, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const ratings = leads.filter((l) => l.rating != null).map((l) => Number(l.rating));
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : "—";

      // Leads chart data based on period
      const dayMap: Record<string, number> = {};

      if (viewMode === 'month') {
        const days = eachDayOfInterval({
          start: startOfMonth(start),
          end: endOfMonth(start)
        });
        days.forEach(d => {
          dayMap[formatDate(d, 'yyyy-MM-dd')] = 0;
        });
        leads.forEach((l) => {
          const day = l.created_at.slice(0, 10);
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
        leads.forEach((l) => {
          const month = l.created_at.slice(0, 7);
          if (dayMap[month] !== undefined) dayMap[month]++;
        });
      } else {
        // Range mode: show daily
        const days = eachDayOfInterval({
          start: start,
          end: end
        });
        // Limit to reasonable number of ticks if range is huge
        days.forEach(d => {
          dayMap[formatDate(d, 'yyyy-MM-dd')] = 0;
        });
        leads.forEach((l) => {
          const day = l.created_at.slice(0, 10);
          if (dayMap[day] !== undefined) dayMap[day]++;
        });
      }

      const leadsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

      const novos = leads.filter((l) => l.status === "novo").length;
      const negociando = leads.filter((l) => l.status === "negociando").length;

      setData({
        totalLeads: leads.length,
        leadsQuentes: leads.filter((l) => l.status === "contatado").length,
        contatados: leads.filter((l) => l.status === "contatado" || l.status === "negociando").length,
        pagos: leads.filter((l) => l.status === "pago").length,
        perdidos: leads.filter((l) => l.status === "perdido").length,
        novos, proposta: negociando,
        withPhone: leads.filter((l) => l.has_phone).length,
        withWebsite: leads.filter((l) => l.has_website).length,
        avgRating,
        pendingFollowUps: followUps.length,
        overdueFollowUps: followUps.filter((f) => new Date(f.due_date) < now).length,
        topNiches,
        followUpsList: followUps.map((f) => ({ id: f.id, title: f.title, due_date: f.due_date, lead_id: f.lead_id, completed: f.completed })),
        leadsByDay,
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
            title={getGreeting()}
            subtitle="Painel de operações ativo — Rataria Intelligence"
            icon={<LayoutDashboard className="h-6 w-6 text-primary" />}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsRow data={data} />
        </motion.div>

        {/* Main grid: chart + pipeline + ranking */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-2">
            <PerformanceChart data={data.leadsByDay} />
          </div>
          <div className="xl:col-span-1">
            <PipelineFunnel data={data} />
          </div>
          <div className="xl:col-span-1">
            <BdrRanking />
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
