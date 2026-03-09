import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    PiggyBank,
    PieChart,
    Shield,
    ShieldCheck,
    Plus,
    Receipt,
    ListFilter,
    Trash2,
    BarChart3,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Calendar,
    Briefcase,
    FileText,
    Users
} from "lucide-react";
import { createNotification } from "@/lib/notifications";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadSelector } from "@/components/LeadSelector";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Payment {
    id: string;
    lead_id: string;
    lead_name?: string;
    bdr_name?: string;
    amount: number;
    status: 'pendente' | 'aprovado';
    include_head: boolean;
    include_bdr: boolean;
    user_id: string;
    created_at: string;
}

interface Expense {
    id: string;
    type: 'fixo' | 'variavel';
    name: string;
    description: string | null;
    amount: number;
    date: string;
}

interface Subscription {
    id: string;
    lead_id: string;
    lead_name?: string;
    amount: number;
    status: 'ativo' | 'cancelado';
    start_date: string;
    created_at: string;
}

const Finance = () => {
    const { isAdmin, loading, user } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM format
    const [viewMode, setViewMode] = useState<'month' | 'year' | 'range'>('month');
    const [customRange, setCustomRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Form States
    const [newPayment, setNewPayment] = useState({ leadId: "", amount: 0 });
    const [newExpense, setNewExpense] = useState({ type: 'fixo' as 'fixo' | 'variavel', name: "", description: "", amount: 0 });
    const [newSubscription, setNewSubscription] = useState({ leadId: "", amount: 0 });

    const fetchData = async () => {
        try {
            const [profilesRes, leadsRes, paymentsRes, expensesRes, subsRes] = await Promise.all([
                supabase.from('profiles').select('*').order('display_name', { ascending: true }),
                supabase.from('leads').select('*').order('name', { ascending: true }),
                supabase.from('payments').select('*, leads(name, user_id)').order('created_at', { ascending: false }),
                supabase.from('expenses').select('*').order('date', { ascending: false }),
                supabase.from('subscriptions').select('*, leads(name)').order('created_at', { ascending: false })
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (leadsRes.error) throw leadsRes.error;
            if (paymentsRes.error) throw paymentsRes.error;
            if (expensesRes.error) throw expensesRes.error;
            if (subsRes.error) throw subsRes.error;

            setUsers(profilesRes.data || []);
            setLeads(leadsRes.data || []);

            // Map payments with lead and BDR names
            const mappedPayments = (paymentsRes.data || []).map(p => {
                const leadData = (p.leads as any);
                const bdr = profilesRes.data?.find(u => u.user_id === leadData?.user_id);
                return {
                    ...p,
                    lead_name: leadData?.name || "Lead Desconhecido",
                    bdr_name: bdr?.display_name || bdr?.email || "BDR não vinculado"
                } as Payment;
            });
            setPayments(mappedPayments);

            // Map subscriptions
            const mappedSubs = (subsRes.data || []).map(s => ({
                ...s,
                lead_name: (s.leads as any)?.name || "Lead Desconhecido"
            })) as Subscription[];
            setSubscriptions(mappedSubs);

            setExpenses(expensesRes.data || [] as any);
        } catch (error: any) {
            console.error("Erro ao buscar dados:", error);
            toast.error("Erro ao carregar dados financeiros");
        }
    };

    useEffect(() => {
        if (!loading && !isAdmin) {
            navigate("/");
            toast.error("Acesso negado", {
                description: "Você não tem permissão para acessar a gestão financeira."
            });
        } else if (!loading && isAdmin) {
            fetchData();
        }
    }, [isAdmin, loading, navigate]);

    // Financial Calculations (Filtered by Month or Year)
    const filteredPayments = payments.filter(p => {
        const pDate = new Date(p.created_at);
        if (viewMode === 'year') {
            return pDate.getFullYear().toString() === selectedMonth.split('-')[0];
        } else if (viewMode === 'month') {
            const pMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
            return pMonth === selectedMonth;
        } else {
            const start = new Date(customRange.from);
            const end = new Date(customRange.to);
            end.setHours(23, 59, 59, 999);
            return pDate >= start && pDate <= end;
        }
    });

    const filteredExpenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        if (viewMode === 'year') {
            return eDate.getFullYear().toString() === selectedMonth.split('-')[0];
        } else if (viewMode === 'month') {
            const eMonth = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, '0')}`;
            return eMonth === selectedMonth;
        } else {
            const start = new Date(customRange.from);
            const end = new Date(customRange.to);
            end.setHours(23, 59, 59, 999);
            return eDate >= start && eDate <= end;
        }
    });

    const approvedPayments = filteredPayments.filter(p => p.status === 'aprovado');
    const totalSalesPaid = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);

    const currentMonthStr = new Date().toISOString().substring(0, 7);

    // Sistema de Faturas Mensais (Estilo Cartão de Crédito)
    const faturasDoMes = subscriptions.map(s => {
        const sMonth = s.start_date ? s.start_date.substring(0, 7) : s.created_at.substring(0, 7);
        // Não gerar fatura de cobrança para meses anteriores ao início da assinatura
        if (selectedMonth < sMonth) return null;

        // Procura pagamentos deste lead neste mesmo mês selecionado
        const leadPaymentsThisMonth = filteredPayments.filter(p => p.lead_id === s.lead_id);
        const paymentFound = leadPaymentsThisMonth.find(p => p.amount === s.amount) || leadPaymentsThisMonth[0];

        let faturaStatus = 'pendente';
        if (paymentFound) {
            faturaStatus = paymentFound.status === 'aprovado' ? 'pago' : 'analise';
        } else if (selectedMonth < currentMonthStr) {
            faturaStatus = 'atrasado';
        } else {
            faturaStatus = 'aberto';
        }

        if (s.status === 'cancelado' && !paymentFound) {
            // Só exibe no histórico de meses anteriores, some nos meses futuros/atuais
            if (selectedMonth >= currentMonthStr) return null;
            faturaStatus = 'cancelado_historico';
        }

        return {
            subscription: s,
            payment: paymentFound,
            status: faturaStatus
        };
    }).filter(f => f !== null) as any[];

    // MRR Teórico Ativo
    const activeSubs = subscriptions.filter(s => s.status === 'ativo' && selectedMonth >= (s.start_date?.substring(0, 7) || s.created_at.substring(0, 7)));
    const totalRecurring = activeSubs.reduce((acc, curr) => acc + curr.amount, 0);

    // Faturas efetivamente pagas neste mês
    const totalRecurringPaid = faturasDoMes.filter(f => f.status === 'pago').reduce((acc, curr) => acc + (curr.payment?.amount || curr.subscription.amount), 0);
    // Vendas Únicas pagas (removemos pagamentos que já foram classificados como fatura pra não duplicar)
    const faturaPaymentIds = faturasDoMes.map(f => f.payment?.id).filter(Boolean);
    const avulsoSalesPaid = approvedPayments.filter(p => !faturaPaymentIds.includes(p.id)).reduce((acc, curr) => acc + curr.amount, 0);

    // Total revenue in the month = Vendas Únicas + Faturas Pagas
    const totalRevenue = avulsoSalesPaid + totalRecurringPaid;

    const totalFixed = filteredExpenses.filter(e => e.type === 'fixo').reduce((acc, curr) => acc + curr.amount, 0);
    const totalVariable = filteredExpenses.filter(e => e.type === 'variavel').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpensesAndCosts = totalFixed + totalVariable;

    // NOVO MODELO (Opcionalidade de Lucro Real): Tira CUSTOS PRIMEIRO
    const profitBeforeCommissions = totalRevenue - totalExpensesAndCosts;
    const netProfit = profitBeforeCommissions > 0 ? profitBeforeCommissions : 0; // The true cash pool for profit sharing

    // Commission logic based on the actual profit divided between parties
    // Head: 25% of the Net Profit
    // BDR:  25% of the Net Profit
    // Comp: 50% of the Net Profit
    const headPayout = netProfit * 0.25;
    const bdrPayout = netProfit * 0.25;
    const companyRetention = netProfit * 0.50;

    // BDR Performance Summary
    const bdrSummaries = users.map(u => {
        // Vendas aprovadas por esse BDR neste mês específico
        const bdrSales = approvedPayments.filter(p => p.user_id === u.user_id);
        const totalSalesVolume = bdrSales.reduce((sum, p) => sum + p.amount, 0);

        // As commissions are now global off the profit pool, we approximate individual share
        // based on how much % of the total sales volume this individual BDR brought in.
        const bdrSharePercentage = totalSalesPaid > 0 ? (totalSalesVolume / totalSalesPaid) : 0;
        const totalCommission = netProfit > 0 ? (bdrPayout * bdrSharePercentage) : 0;

        return {
            id: u.user_id,
            name: u.display_name || u.email,
            totalSalesVolume,
            totalCommission,
            salesCount: bdrSales.length
        };
    }).filter(summary => summary.totalSalesVolume > 0 || summary.totalCommission > 0)
        .sort((a, b) => b.totalSalesVolume - a.totalSalesVolume); // Sort desc

    const handleAddPayment = async () => {
        if (!newPayment.leadId || newPayment.amount <= 0 || !user) {
            toast.error("Selecione um lead e um valor válido");
            return;
        }

        const { error } = await supabase.from('payments').insert({
            lead_id: newPayment.leadId,
            amount: newPayment.amount,
            status: 'pendente',
            include_head: true,
            include_bdr: true,
            user_id: user.id
        });

        if (error) {
            toast.error("Erro ao registrar pagamento: " + error.message);
            return;
        }

        setNewPayment({ leadId: "", amount: 0 });
        toast.success("Recebimento registrado e aguardando aprovação!");

        // Notify admin about new payment (simulated, usually we'd notify specific roles)
        await createNotification(
            user.id,
            "Pagamento Registrado",
            `Um novo pagamento de R$ ${newPayment.amount} foi registrado para o lead ${leads.find(l => l.id === newPayment.leadId)?.name}.`,
            'payment'
        );

        fetchData();
    };

    const handleAddSubscription = async () => {
        if (!newSubscription.leadId || newSubscription.amount <= 0) {
            toast.error("Selecione um lead e um valor mensal válido");
            return;
        }

        const { error } = await supabase.from('subscriptions').insert({
            lead_id: newSubscription.leadId,
            amount: newSubscription.amount,
            status: 'ativo',
            start_date: new Date().toISOString().split('T')[0]
        });

        if (error) {
            toast.error("Erro ao registrar recorrência: " + error.message);
            return;
        }

        setNewSubscription({ leadId: "", amount: 0 });
        toast.success("Recorrência ativada com sucesso!");
        fetchData();
    };

    const handlePayFatura = async (fatura: any) => {
        if (!user) return;

        const invoiceDate = selectedMonth === currentMonthStr
            ? new Date().toISOString()
            : new Date(`${selectedMonth}-10T12:00:00Z`).toISOString();

        const { error } = await supabase.from('payments').insert({
            lead_id: fatura.subscription.lead_id,
            amount: fatura.subscription.amount,
            status: 'pendente',
            include_head: true,
            include_bdr: true,
            user_id: user.id,
            created_at: invoiceDate
        });

        if (error) {
            toast.error("Erro ao gerar pagamento da fatura: " + error.message);
            return;
        }

        toast.success("Pagamento de fatura registrado e aguardando aprovação!");
        fetchData();
    };

    const approvePayment = async (id: string) => {
        const { error } = await supabase.from('payments')
            .update({ status: 'aprovado', approved_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            toast.error("Erro ao aprovar: " + error.message);
            return;
        }

        const payment = payments.find(p => p.id === id);
        if (payment && user) {
            await createNotification(
                payment.user_id,
                "Pagamento Aprovado! ✅",
                `Seu lançamento de R$ ${payment.amount} para ${payment.lead_name} foi aprovado com sucesso.`,
                'payment'
            );
        }

        toast.success("Pagamento aprovado!");
        fetchData();
    };

    const handleAddExpense = async () => {
        if (!newExpense.name || newExpense.amount <= 0) {
            toast.error("Preencha o nome e o valor do gasto");
            return;
        }

        const { error } = await supabase.from('expenses').insert({
            ...newExpense,
            date: new Date().toISOString().split('T')[0]
        });

        if (error) {
            toast.error("Erro ao registrar gasto: " + error.message);
            return;
        }

        setNewExpense({ type: 'fixo', name: "", description: "", amount: 0 });
        toast.success("Gasto registrado!");

        if (user) {
            await createNotification(
                user.id,
                "Gasto Adicionado",
                `Um novo gasto de R$ ${newExpense.amount} (${newExpense.name}) foi registrado no sistema.`,
                'system'
            );
        }

        fetchData();
    };

    const removePayment = async (id: string) => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) toast.error("Erro ao remover: " + error.message);
        else fetchData();
    };

    const removeExpense = async (id: string) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) toast.error("Erro ao remover: " + error.message);
        else fetchData();
    };

    const toggleSubscriptionStatus = async (id: string, newStatus: 'ativo' | 'cancelado') => {
        const { error } = await supabase.from('subscriptions').update({ status: newStatus }).eq('id', id);
        if (error) toast.error("Erro ao atualizar: " + error.message);
        else {
            toast.success(`Recorrência ${newStatus}!`);

            if (user) {
                const sub = subscriptions.find(s => s.id === id);
                await createNotification(
                    user.id,
                    `Assinatura ${newStatus === 'ativo' ? 'Ativada' : 'Suspensa'}`,
                    `A recorrência do lead ${(sub as any)?.leads?.name || '---'} agora está ${newStatus}.`,
                    'payment'
                );
            }

            fetchData();
        }
    };

    if (loading || !isAdmin) return null;

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };


    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <motion.div initial="hidden" animate="visible" variants={itemVariants}>
                    <PeriodSelector
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                        customRange={customRange}
                        setCustomRange={setCustomRange}
                        title="Gestão Financeira"
                        subtitle="Faturamento & Governança de Lucro"
                        icon={<DollarSign className="h-6 w-6 text-primary" />}
                    />
                </motion.div>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-6 max-w-[1200px] h-12 bg-muted/20 p-1 border border-primary/5 rounded-2xl">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <PieChart className="h-4 w-4 mr-2" />
                            Painel
                        </TabsTrigger>
                        <TabsTrigger value="report" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Relatório
                        </TabsTrigger>
                        <TabsTrigger value="receivables" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <Receipt className="h-4 w-4 mr-2" />
                            Vendas
                        </TabsTrigger>
                        <TabsTrigger value="subscriptions" className="rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Recorrências
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <Wallet className="h-4 w-4 mr-2" />
                            Gastos
                        </TabsTrigger>
                        <TabsTrigger value="payroll" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]">
                            <Users className="h-4 w-4 mr-2" />
                            Payroll
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 outline-none">
                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-emerald-500/5 border-emerald-500/10 rounded-3xl overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl"><DollarSign className="h-5 w-5 text-emerald-500" /></div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0">+12%</Badge>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Faturamento Bruto</p>
                                    <h3 className="text-2xl font-black mt-1">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                </CardContent>
                            </Card>

                            <Card className="bg-destructive/5 border-destructive/10 rounded-3xl overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-destructive/10 rounded-xl"><ArrowDownCircle className="h-5 w-5 text-destructive" /></div>
                                        <Badge variant="outline" className="text-destructive border-destructive/20">Fixo</Badge>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custos Fixos</p>
                                    <h3 className="text-2xl font-black mt-1 text-destructive">R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                </CardContent>
                            </Card>

                            <Card className="bg-amber-500/5 border-amber-500/10 rounded-3xl overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-amber-500/10 rounded-xl"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
                                        <Badge variant="outline" className="text-amber-500 border-amber-500/20">Variável</Badge>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custos Variáveis</p>
                                    <h3 className="text-2xl font-black mt-1 text-amber-500">R$ {totalVariable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/10 rounded-3xl overflow-hidden shadow-lg shadow-primary/5 ring-1 ring-primary/20">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-primary/10 rounded-xl"><PiggyBank className="h-5 w-5 text-primary" /></div>
                                        <div className="animate-pulse flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="text-[8px] font-black text-primary">LIVE</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lucro Líquido</p>
                                    <h3 className="text-2xl font-black mt-1 text-foreground">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="rounded-[2.5rem] border-primary/10 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col min-h-[400px]">
                                <CardHeader className="bg-primary/5 p-8 border-b border-primary/10 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Divisão de Resultado</span>
                                    <h3 className="text-4xl font-black tracking-tighter mt-2">Payout Automático</h3>
                                </CardHeader>
                                <CardContent className="p-8 flex-1 flex flex-col justify-center space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="space-y-3 text-center p-6 rounded-3xl bg-secondary/20 border border-border group hover:bg-secondary/30 transition-all">
                                            <Shield className="h-6 w-6 text-primary mx-auto" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Head Op.</p>
                                                <p className="text-xl font-black">R$ {headPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <Badge variant="outline" className="mt-2 text-[8px] border-primary/20 uppercase">25% do Lucro Líquido</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-center p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all scale-110 shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/20">
                                            <Briefcase className="h-6 w-6 text-emerald-500 mx-auto" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Comissão BDR</p>
                                                <p className="text-xl font-black text-emerald-500">R$ {bdrPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <Badge variant="outline" className="mt-2 text-[8px] bg-emerald-500/10 border-emerald-500/20 text-emerald-500 uppercase">25% do Lucro Líquido</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-center p-6 rounded-3xl bg-secondary/20 border border-border group hover:bg-secondary/30 transition-all">
                                            <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Empresa</p>
                                                <p className="text-xl font-black">R$ {companyRetention.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <Badge variant="outline" className="mt-2 text-[8px] border-border uppercase">50% do Lucro Líquido</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border text-center">
                                        <p className="text-[10px] text-muted-foreground font-medium italic">"A divisão agora calcula a margem líquida. Todos os faturamentos são agrupados, as despesas do mês são subtraídas, e o restante (Lucro Líquido) é repartido."</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="rounded-[2.5rem] border-primary/10 bg-card/30 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                                            Histórico de Vendas
                                            <Receipt className="h-4 w-4 text-primary" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {filteredPayments.slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-3 bg-background/40 rounded-2xl border border-border/50 group hover:border-emerald-500/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><Plus className="h-4 w-4 text-emerald-500" /></div>
                                                        <div>
                                                            <p className="text-sm font-bold">{p.lead_name}</p>
                                                            <p className="text-[9px] text-muted-foreground uppercase font-black">BDR: {p.bdr_name}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-emerald-500">R$ {p.amount.toLocaleString('pt-BR')}</p>
                                                </div>
                                            ))}
                                            {filteredPayments.length === 0 && (
                                                <div className="py-8 text-center opacity-40 italic text-xs">Nenhuma venda registrada neste mês.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2.5rem] border-primary/10 bg-card/30 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                                            Últimos Gastos
                                            <Wallet className="h-4 w-4 text-destructive" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {filteredExpenses.slice(0, 3).map(e => (
                                                <div key={e.id} className="flex items-center justify-between p-3 bg-background/40 rounded-2xl border border-border/50 group hover:border-destructive/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${e.type === 'fixo' ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                                                            {e.type === 'fixo' ? <ArrowDownCircle className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-amber-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{e.name}</p>
                                                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tight">{e.type}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-destructive">R$ -{e.amount.toLocaleString('pt-BR')}</p>
                                                </div>
                                            ))}
                                            {filteredExpenses.length === 0 && (
                                                <div className="py-8 text-center opacity-40 italic text-xs">Nenhum gasto registrado neste mês.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2.5rem] border-primary/10 bg-card/30 overflow-hidden md:col-span-2 lg:col-span-1">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                                            Ranking BDRs do Mês
                                            <Users className="h-4 w-4 text-primary" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {bdrSummaries.length === 0 ? (
                                                <div className="py-8 text-center opacity-40 italic text-xs">Nenhum BDR com faturamento neste mês.</div>
                                            ) : (
                                                bdrSummaries.map((bdr, idx) => (
                                                    <div key={bdr.id} className="flex flex-col p-3 bg-background/40 rounded-2xl border border-border/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-muted-foreground w-4">{idx + 1}º</span>
                                                                <p className="text-sm font-bold truncate max-w-[120px]">{bdr.name}</p>
                                                            </div>
                                                            <Badge className="bg-primary/10 text-primary border-0 text-[9px] font-black uppercase">{bdr.salesCount} vendas</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                                            <div className="bg-muted/30 rounded-xl p-2 text-center">
                                                                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Faturado</p>
                                                                <p className="text-xs font-black text-foreground">R$ {bdr.totalSalesVolume.toLocaleString('pt-BR')}</p>
                                                            </div>
                                                            <div className="bg-emerald-500/5 rounded-xl p-2 text-center">
                                                                <p className="text-[8px] text-emerald-500/60 font-black uppercase tracking-widest">Comissão Paga</p>
                                                                <p className="text-xs font-black text-emerald-500">R$ {bdr.totalCommission.toLocaleString('pt-BR')}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="report" className="space-y-6 outline-none">
                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="rounded-[2.5rem] border-primary/10 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col">
                                <CardHeader className="p-8 border-b border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl"><TrendingUp className="h-6 w-6 text-emerald-500" /></div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Performance Anual</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Entrada Total</span>
                                            <span className="text-xl font-black text-emerald-500">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Saída Total</span>
                                            <span className="text-xl font-black text-destructive">R$ -{totalExpensesAndCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-primary/10 p-5 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                                            <span className="text-xs font-black uppercase tracking-widest text-primary">Margem Final</span>
                                            <div className="text-right">
                                                <span className="block text-2xl font-black">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                <span className="text-[9px] font-bold text-primary italic uppercase tracking-tighter">Disponível para saque</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <PieChart className="h-3 w-3 text-primary" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Saúde Financeira</span>
                                        </div>
                                        <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${Math.min((netProfit / (totalRevenue || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[8px] mt-2 opacity-50 font-medium">Margem de lucro atual: {((netProfit / (totalRevenue || 1)) * 100).toFixed(1)}%</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-primary/10 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col lg:col-span-2">
                                <CardHeader className="p-8 border-b border-primary/10 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-2xl"><PieChart className="h-6 w-6 text-primary" /></div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Composição de Custos</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="border-primary/20 text-[10px] uppercase font-black px-3 py-1">Análise Proporcional</Badge>
                                </CardHeader>
                                <CardContent className="p-8 flex flex-col md:flex-row gap-8 items-center justify-center">
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        {/* Creative SVG Gauge representation */}
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/10" />
                                            <circle
                                                cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent"
                                                strokeDasharray={2 * Math.PI * 80}
                                                strokeDashoffset={(2 * Math.PI * 80) * (1 - (totalFixed / (totalExpensesAndCosts || 1)))}
                                                className="text-destructive transition-all duration-1000"
                                            />
                                            <circle
                                                cx="96" cy="96" r="60" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/10"
                                            />
                                            <circle
                                                cx="96" cy="96" r="60" stroke="currentColor" strokeWidth="12" fill="transparent"
                                                strokeDasharray={2 * Math.PI * 60}
                                                strokeDashoffset={(2 * Math.PI * 60) * (1 - (totalVariable / (totalExpensesAndCosts || 1)))}
                                                className="text-amber-500 transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transform rotate-0">
                                            <span className="text-[10px] font-black uppercase opacity-40">Custos</span>
                                            <span className="text-2xl font-black">100%</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="p-5 bg-background/50 rounded-3xl border border-border group hover:border-destructive/20 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-destructive" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Comprometimento Fixo</span>
                                                </div>
                                                <span className="text-xs font-black text-destructive">{((totalFixed / (totalExpensesAndCosts || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Gastos recorrentes que acontecem independente das vendas.</p>
                                        </div>
                                        <div className="p-5 bg-background/50 rounded-3xl border border-border group hover:border-amber-500/20 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Variáveis de Operação</span>
                                                </div>
                                                <span className="text-xs font-black text-amber-500">{((totalVariable / (totalExpensesAndCosts || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Custos que escalam conforme o volume de novos projetos.</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-8 border-t border-primary/10 bg-primary/5 mt-auto">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                        <Plus className="h-3 w-3" /> Lançamento Rápido de Gasto
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <div className="sm:col-span-2">
                                            <Input
                                                placeholder="Nome do gasto (ex: Servidor AWS)"
                                                className="h-10 text-[11px] rounded-xl bg-background border-primary/10"
                                                value={newExpense.name}
                                                onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <Select value={newExpense.type} onValueChange={(v: any) => setNewExpense(prev => ({ ...prev, type: v }))}>
                                                <SelectTrigger className="h-10 text-[11px] rounded-xl bg-background border-primary/10">
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="fixo" className="text-[11px]">Fixo</SelectItem>
                                                    <SelectItem value="variavel" className="text-[11px]">Variável</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    placeholder="0,00"
                                                    className="h-10 pl-8 text-[11px] rounded-xl bg-background border-primary/10"
                                                    value={newExpense.amount || ""}
                                                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleAddExpense}
                                        className="w-full mt-3 h-10 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/10"
                                    >
                                        Registrar Saída no Caixa
                                    </Button>
                                </div>
                            </Card>

                            <Card className="rounded-[2.5rem] border-primary/10 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col lg:col-span-3">
                                <CardHeader className="p-8 border-b border-primary/10 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-500/10 rounded-2xl"><ShieldCheck className="h-6 w-6 text-indigo-500" /></div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Divisão de Dividendos (Real)</CardTitle>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className="bg-indigo-500/10 text-indigo-500 border-0 text-[10px] font-black uppercase px-3 py-1">Payout Ratio: 100%</Badge>
                                        <Badge variant="outline" className="border-muted-foreground/20 text-[10px] uppercase font-black px-3 py-1">Impostos: Isento</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Sócio Master</span>
                                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-0.5 rounded-full">25%</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-foreground">Distribuição Head</h4>
                                                    <p className="text-3xl font-black mt-2">R$ {headPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">Cálculo baseado no saldo remanescente após todos os custos diretos da operação.</p>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500/60">Equipe BDR</span>
                                                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-0.5 rounded-full">25%</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-foreground">Fundo de Comissões</h4>
                                                    <p className="text-3xl font-black text-emerald-500 mt-2">R$ {bdrPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">Montante total a ser dividido entre os vendedores proporcionalmente ao faturamento gerado.</p>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500/60">Reserva Empresa</span>
                                                    <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-500 px-3 py-0.5 rounded-full">50%</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-foreground">Caixa de Expansão</h4>
                                                    <p className="text-3xl font-black text-indigo-500 mt-2">R$ {companyRetention.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-relaxed">Capital retido para reinvestimento em tecnologia, marketing e estrutura física.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-2xl"><BarChart3 className="h-6 w-6 text-primary" /></div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest">Potencial de Escalonamento</h4>
                                                <p className="text-[11px] text-muted-foreground">Com base no MRR atual de R$ {totalRecurring.toLocaleString('pt-BR')}, a projeção anual de faturamento é de R$ {(totalRecurring * 12).toLocaleString('pt-BR')}.</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 font-black uppercase text-[10px] h-12 px-8">Exportar DRE Completo</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="receivables" className="space-y-6 outline-none">
                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-1 rounded-[2.5rem] border-primary/10 bg-card/50 overflow-hidden">
                                <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
                                    <CardTitle className="text-lg font-black tracking-tight uppercase">Novo Recebimento</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Lead que Pagou</Label>
                                        <LeadSelector
                                            leads={leads}
                                            value={newPayment.leadId}
                                            onValueChange={(v) => setNewPayment(prev => ({ ...prev, leadId: v }))}
                                            placeholder="Pesquise o nome do cliente..."
                                        />
                                        {newPayment.leadId && (
                                            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1 ml-1 flex items-center gap-1.5">
                                                <ShieldCheck className="h-3 w-3" />
                                                BDR: {users.find(u => u.user_id === leads.find(l => l.id === newPayment.leadId)?.user_id)?.display_name || "Livre"}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Valor do Pagamento (R$)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500/50" />
                                            <Input
                                                type="number"
                                                className="h-12 pl-12 rounded-2xl bg-background/50 border-primary/10 font-bold focus:border-emerald-500/50"
                                                placeholder="0,00"
                                                value={newPayment.amount || ""}
                                                onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleAddPayment} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2">
                                        <Plus className="h-5 w-5" /> Registrar Venda
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2 rounded-[2.5rem] border-primary/10 bg-card/30 overflow-hidden">
                                <div className="overflow-x-auto w-full">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-primary/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-6">Lead / Cliente</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Responsável (BDR)</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Valor Liq.</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Comissionamento</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Status</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 text-right px-6">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPayments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-20 text-center text-muted-foreground opacity-50 italic">
                                                        Nenhum recebimento registrado neste mês. Altere a data no topo ou adicione o faturamento na lateral.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredPayments.map(p => (
                                                    <TableRow key={p.id} className="group hover:bg-primary/5 border-primary/5 transition-colors">
                                                        <TableCell className="py-6 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                                                    <Briefcase className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-sm">{p.lead_name}</span>
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(p.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-black">{p.bdr_name}</Badge>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            {p.status === 'pendente' ? (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-muted-foreground mr-1">R$</span>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 w-24 bg-background/50 border-primary/20 text-xs font-black p-1 text-center rounded-lg"
                                                                        value={p.amount}
                                                                        onChange={async (e) => {
                                                                            const val = Number(e.target.value);
                                                                            setPayments(prev => prev.map(item => item.id === p.id ? { ...item, amount: val } : item));
                                                                            await supabase.from('payments').update({ amount: val }).eq('id', p.id);
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="font-black text-emerald-500">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <div className="flex flex-col gap-2">
                                                                <label className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase cursor-pointer group/label">
                                                                    <div className="w-4 h-4 rounded-[4px] border border-primary/30 flex items-center justify-center bg-background/50 overflow-hidden">
                                                                        <input type="checkbox" className="w-full h-full appearance-none checked:bg-emerald-500 transition-colors" checked={p.include_bdr} onChange={async (e) => {
                                                                            const val = e.target.checked;
                                                                            setPayments(prev => prev.map(item => item.id === p.id ? { ...item, include_bdr: val } : item));
                                                                            await supabase.from('payments').update({ include_bdr: val }).eq('id', p.id);
                                                                        }} disabled={p.status === 'aprovado'} />
                                                                    </div>
                                                                    <span className="group-hover/label:text-emerald-500 transition-colors">Comissão BDR (25%)</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase cursor-pointer group/label">
                                                                    <div className="w-4 h-4 rounded-[4px] border border-primary/30 flex items-center justify-center bg-background/50 overflow-hidden">
                                                                        <input type="checkbox" className="w-full h-full appearance-none checked:bg-emerald-500 transition-colors" checked={p.include_head} onChange={async (e) => {
                                                                            const val = e.target.checked;
                                                                            setPayments(prev => prev.map(item => item.id === p.id ? { ...item, include_head: val } : item));
                                                                            await supabase.from('payments').update({ include_head: val }).eq('id', p.id);
                                                                        }} disabled={p.status === 'aprovado'} />
                                                                    </div>
                                                                    <span className="group-hover/label:text-emerald-500 transition-colors">Comissão Head (25%)</span>
                                                                </label>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <Badge className={p.status === 'aprovado' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                                                                {p.status === 'aprovado' ? 'Validado' : 'Análise'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-6 text-right px-6">
                                                            <div className="flex justify-end gap-2">
                                                                {p.status === 'pendente' && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-8 bg-emerald-500 hover:bg-emerald-600 font-bold px-3 rounded-lg text-[10px] uppercase tracking-wider"
                                                                        onClick={() => approvePayment(p.id)}
                                                                    >
                                                                        Aprovar
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all" onClick={() => removePayment(p.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="subscriptions" className="space-y-6 outline-none">
                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-1 rounded-[2.5rem] border-indigo-500/10 bg-card/50 overflow-hidden">
                                <CardHeader className="bg-indigo-500/5 p-6 border-b border-indigo-500/10">
                                    <CardTitle className="text-lg font-black tracking-tight text-indigo-500 uppercase flex items-center gap-2">
                                        <Plus className="h-5 w-5" /> Nova Recorrência
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Cliente / Projeto</Label>
                                        <LeadSelector
                                            leads={leads}
                                            value={newSubscription.leadId}
                                            onValueChange={(v) => setNewSubscription(prev => ({ ...prev, leadId: v }))}
                                            placeholder="Pesquise o nome do cliente..."
                                            className="border-indigo-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Valor Mensal / MRR (R$)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500/50" />
                                            <Input
                                                type="number"
                                                className="h-12 pl-12 rounded-2xl bg-background/50 border-indigo-500/20 font-bold focus:border-indigo-500/50"
                                                placeholder="0,00"
                                                value={newSubscription.amount || ""}
                                                onChange={(e) => setNewSubscription(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleAddSubscription} className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/20 transition-all active:scale-95 gap-2">
                                        <Plus className="h-5 w-5" /> Iniciar Recorrência
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2 rounded-[2.5rem] border-indigo-500/10 bg-indigo-500/5 overflow-hidden">
                                <CardHeader className="bg-indigo-500/5 p-6 border-b border-indigo-500/10">
                                    <CardTitle className="text-lg font-black tracking-tight text-indigo-500 uppercase flex items-center justify-between">
                                        Carteira de Recorrências Mensais (MRR)
                                        <Badge className="bg-indigo-500/20 text-indigo-500 border-0 h-8 px-4 text-xs font-black uppercase">
                                            MRR Atual: R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <div className="overflow-x-auto w-full">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-indigo-500/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-6">Cliente</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Vínculo Inicial</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Fatura (R$)</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Status ({selectedMonth})</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 text-right px-6">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {faturasDoMes.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground opacity-50 italic">
                                                        Nenhuma fatura de recorrência gerada para o mês selecionado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                faturasDoMes.map((fatura, idx) => (
                                                    <TableRow key={fatura.subscription.id + idx} className="group hover:bg-indigo-500/5 border-indigo-500/5 transition-colors">
                                                        <TableCell className="py-6 px-6">
                                                            <span className="font-black text-sm">{fatura.subscription.lead_name}</span>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <span className="text-xs font-bold text-muted-foreground font-mono">{new Date(fatura.subscription.start_date || fatura.subscription.created_at).toLocaleDateString()}</span>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <span className="font-black text-indigo-500">R$ {fatura.subscription.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            {fatura.status === 'pago' && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Fatura Paga</Badge>}
                                                            {fatura.status === 'analise' && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Em Análise</Badge>}
                                                            {fatura.status === 'aberto' && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Em Aberto</Badge>}
                                                            {fatura.status === 'pendente' && <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Pendente</Badge>}
                                                            {fatura.status === 'atrasado' && <Badge className="bg-destructive/10 text-destructive border-destructive/20">Atrasado</Badge>}
                                                            {fatura.status === 'cancelado_historico' && <Badge className="bg-muted text-muted-foreground border-border">Cancelado</Badge>}
                                                        </TableCell>
                                                        <TableCell className="py-6 text-right px-6">
                                                            <div className="flex justify-end gap-2">
                                                                {(fatura.status === 'aberto' || fatura.status === 'pendente' || fatura.status === 'atrasado') && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="text-[10px] font-black tracking-widest uppercase bg-indigo-500 hover:bg-indigo-600 text-white h-8 px-4 border-0 rounded-xl"
                                                                        onClick={() => handlePayFatura(fatura)}
                                                                    >
                                                                        Mapear Pagamento
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`text-[10px] font-bold tracking-widest uppercase hover:bg-background/50 h-8 px-4 border rounded-xl ${fatura.subscription.status === 'ativo' ? 'text-destructive border-destructive/20 hover:text-destructive' : 'text-emerald-500 border-emerald-500/20 hover:text-emerald-500'}`}
                                                                    onClick={() => toggleSubscriptionStatus(fatura.subscription.id, fatura.subscription.status === 'ativo' ? 'cancelado' : 'ativo')}
                                                                >
                                                                    {fatura.subscription.status === 'ativo' ? 'Suspender' : 'Reativar'}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="expenses" className="space-y-6 outline-none">
                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <Card className="lg:col-span-1 rounded-[2.5rem] border-primary/10 bg-card/50 overflow-hidden">
                                <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
                                    <CardTitle className="text-lg font-black tracking-tight uppercase">Novo Lançamento</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/20 rounded-2xl border border-primary/5">
                                        <button
                                            onClick={() => setNewExpense(prev => ({ ...prev, type: 'fixo' }))}
                                            className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${newExpense.type === 'fixo' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Gasto Fixo
                                        </button>
                                        <button
                                            onClick={() => setNewExpense(prev => ({ ...prev, type: 'variavel' }))}
                                            className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${newExpense.type === 'variavel' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Gasto Var.
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nome / Título</Label>
                                        <Input
                                            className="h-12 rounded-2xl bg-background/50 border-primary/10 font-bold"
                                            placeholder="Ex: Aluguel, Tráfego Pago..."
                                            value={newExpense.name}
                                            onChange={(e) => setNewExpense(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Descrição</Label>
                                        <Input
                                            className="h-12 rounded-2xl bg-background/50 border-primary/10 font-bold"
                                            placeholder="Breve detalhamento..."
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Valor (R$)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive/50" />
                                            <Input
                                                type="number"
                                                className="h-12 pl-12 rounded-2xl bg-background/50 border-primary/10 font-black focus:border-destructive/50"
                                                placeholder="0,00"
                                                value={newExpense.amount || ""}
                                                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleAddExpense} className="w-full h-14 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-black shadow-lg shadow-destructive/20 transition-all active:scale-95 gap-2 mt-4">
                                        <Plus className="h-5 w-5" /> Lançar Despesa
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-3 rounded-[2.5rem] border-primary/10 bg-card/30 overflow-hidden">
                                <div className="overflow-x-auto w-full">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-primary/5 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-6">Tipo / Nome</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Descrição</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Data</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Valor</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 text-right px-6">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredExpenses.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground opacity-50 italic">
                                                        Nenhuma despesa lançada neste mês. Use o formulário à esquerda.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredExpenses.map(e => (
                                                    <TableRow key={e.id} className="group hover:bg-destructive/5 border-primary/5 transition-colors">
                                                        <TableCell className="py-6 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${e.type === 'fixo' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                    {e.type === 'fixo' ? <ArrowDownCircle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-sm">{e.name}</span>
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${e.type === 'fixo' ? 'text-destructive/60' : 'text-amber-500/60'}`}>{e.type}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <span className="text-xs font-medium text-muted-foreground line-clamp-1">{e.description || "---"}</span>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <span className="text-xs font-bold text-muted-foreground font-mono">{new Date(e.date).toLocaleDateString()}</span>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <span className="font-black text-destructive">R$ {e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </TableCell>
                                                        <TableCell className="py-6 text-right px-6">
                                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all" onClick={() => removeExpense(e.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="payroll" className="space-y-6 outline-none">
                        <motion.div initial="hidden" animate="visible" variants={itemVariants} className="space-y-6">
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-emerald-500/5 border-emerald-500/10 rounded-3xl">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-xl"><Users className="h-5 w-5 text-emerald-500" /></div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Comissões (BDRs)</p>
                                        <h3 className="text-2xl font-black mt-1 text-emerald-500">R$ {bdrPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                        <p className="text-[10px] text-muted-foreground mt-1">25% do Lucro Líquido</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-primary/5 border-primary/10 rounded-3xl">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 bg-primary/10 rounded-xl"><Shield className="h-5 w-5 text-primary" /></div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Head Comercial</p>
                                        <h3 className="text-2xl font-black mt-1">R$ {headPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                        <p className="text-[10px] text-muted-foreground mt-1">25% do Lucro Líquido</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/40 border-primary/10 rounded-3xl">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 bg-muted/30 rounded-xl"><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Folha do Mês</p>
                                        <h3 className="text-2xl font-black mt-1">R$ {(bdrPayout + headPayout).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                                        <p className="text-[10px] text-muted-foreground mt-1">BDRs + Head</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* BDR Payroll Table */}
                            <Card className="rounded-[2.5rem] border-primary/10 bg-card/30 backdrop-blur-md overflow-hidden">
                                <CardHeader className="p-8 border-b border-primary/10 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl"><Users className="h-6 w-6 text-emerald-500" /></div>
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tighter">Folha de Pagamento</CardTitle>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Comissões individuais por BDR</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black uppercase px-3 py-1">
                                        {bdrSummaries.length} colaborador{bdrSummaries.length !== 1 ? 'es' : ''}
                                    </Badge>
                                </CardHeader>
                                <Table>
                                    <TableHeader className="bg-muted/20">
                                        <TableRow className="border-primary/5">
                                            <TableHead className="text-[10px] uppercase tracking-widest font-black py-5 px-8">Colaborador</TableHead>
                                            <TableHead className="text-[10px] uppercase tracking-widest font-black py-5">Vendas</TableHead>
                                            <TableHead className="text-[10px] uppercase tracking-widest font-black py-5">Faturado</TableHead>
                                            <TableHead className="text-[10px] uppercase tracking-widest font-black py-5">Comissão</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bdrSummaries.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-20 text-center text-muted-foreground opacity-50 italic">
                                                    Nenhum BDR com vendas neste período.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            bdrSummaries.map((bdr, idx) => (
                                                <TableRow key={bdr.id} className="group hover:bg-emerald-500/5 border-primary/5 transition-colors">
                                                    <TableCell className="py-6 px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-sm font-black text-emerald-500">
                                                                {idx + 1}º
                                                            </div>
                                                            <span className="font-black text-sm">{bdr.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-6">
                                                        <Badge variant="outline" className="text-[10px] font-black border-primary/20">{bdr.salesCount} vendas</Badge>
                                                    </TableCell>
                                                    <TableCell className="py-6">
                                                        <span className="font-bold text-sm">R$ {bdr.totalSalesVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                    <TableCell className="py-6">
                                                        <span className="font-black text-emerald-500 text-lg">R$ {bdr.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        {bdrSummaries.length > 0 && (
                                            <TableRow className="bg-emerald-500/5 border-t-2 border-emerald-500/20">
                                                <TableCell colSpan={2} className="py-6 px-8">
                                                    <span className="font-black text-sm uppercase tracking-widest">Total</span>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <span className="font-black text-sm">R$ {totalSalesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <span className="font-black text-emerald-500 text-lg">R$ {bdrPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>

                            {/* Head Payout Card */}
                            <Card className="rounded-[2.5rem] border-primary/10 bg-card/30 backdrop-blur-md overflow-hidden">
                                <CardContent className="p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-2xl"><Shield className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-widest">Head Comercial</h4>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">25% do lucro líquido de R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black">R$ {headPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>
                </Tabs>

                <motion.div initial="hidden" animate="visible" variants={itemVariants} className="bg-muted/10 border border-primary/5 rounded-3xl p-6 flex gap-6 items-center backdrop-blur-md">
                    <div className="bg-primary/10 p-3 rounded-2xl shadow-inner border border-primary/20">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-black tracking-[0.3em] text-foreground uppercase opacity-80">Ambiente Administrativo Seguro</h4>
                        <p className="text-[11px] text-muted-foreground font-medium">As informações financeiras, recebimentos de leads e lançamentos de custos são protegidos por criptografia e visíveis apenas para Administradores Master da Rataria Intelligence.</p>
                    </div>
                </motion.div>
            </div >
        </DashboardLayout >
    );
};

export default Finance;

