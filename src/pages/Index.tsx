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
  fechados: number;
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
    totalLeads: 0, leadsQuentes: 0, contatados: 0, fechados: 0, perdidos: 0,
    novos: 0, proposta: 0,
    withPhone: 0, withWebsite: 0, avgRating: "—", pendingFollowUps: 0,
    overdueFollowUps: 0, topNiches: [], followUpsList: [], leadsByDay: [],
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [leadsRes, followUpsRes] = await Promise.all([
        supabase.from("leads").select("*").eq("user_id", user.id),
        supabase.from("follow_ups").select("*").eq("user_id", user.id).eq("completed", false).order("due_date", { ascending: true }).limit(10),
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

      // Leads by day (last 30 days)
      const dayMap: Record<string, number> = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      leads.forEach((l) => {
        const day = l.created_at.slice(0, 10);
        if (dayMap[day] !== undefined) dayMap[day]++;
      });
      const leadsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

      const novos = leads.filter((l) => l.status === "novo").length;
      const proposta = leads.filter((l) => l.status === "proposta").length;

      setData({
        totalLeads: leads.length,
        leadsQuentes: leads.filter((l) => l.status === "contato").length,
        contatados: leads.filter((l) => l.status === "contato" || l.status === "proposta").length,
        fechados: leads.filter((l) => l.status === "fechado").length,
        perdidos: leads.filter((l) => l.status === "perdido").length,
        novos, proposta,
        withPhone: leads.filter((l) => l.has_phone).length,
        withWebsite: leads.filter((l) => l.has_website).length,
        avgRating,
        pendingFollowUps: followUps.length,
        overdueFollowUps: followUps.filter((f) => new Date(f.due_date) < now).length,
        topNiches,
        followUpsList: followUps.map((f) => ({ id: f.id, title: f.title, due_date: f.due_date, lead_id: f.lead_id, completed: f.completed })),
        leadsByDay,
      });
    };

    fetchData();
  }, [user]);

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
          <h1 className="text-2xl font-bold text-foreground">Nexora Pro 🚀</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bem-vindo ao Nexora! Seu dashboard local está pronto. 🚀
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatsRow data={data} />
        </motion.div>

        {/* Main grid: chart + pipeline */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PerformanceChart data={data.leadsByDay} />
          </div>
          <PipelineFunnel data={data} />
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
