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
    Calendar,
    Briefcase,
    FileText
} from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    leadId: string;
    leadName: string;
    bdrName: string;
    amount: number;
    date: string;
}

interface Expense {
    id: string;
    type: 'fixo' | 'variavel';
    name: string;
    description: string;
    amount: number;
    date: string;
}

const Finance = () => {
    const { isAdmin, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAdmin) {
            navigate("/");
            toast.error("Acesso negado", {
                description: "Você não tem permissão para acessar a gestão financeira."
            });
        }
    }, [isAdmin, loading, navigate]);

    const [users, setUsers] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);

    // Financial Lists
    const [payments, setPayments] = useState<Payment[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    // Form States
    const [newPayment, setNewPayment] = useState({ leadId: "", amount: 0 });
    const [newExpense, setNewExpense] = useState({ type: 'fixo' as 'fixo' | 'variavel', name: "", description: "", amount: 0 });

    // Calculations
    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalFixed = expenses.filter(e => e.type === 'fixo').reduce((acc, curr) => acc + curr.amount, 0);
    const totalVariable = expenses.filter(e => e.type === 'variavel').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = totalFixed + totalVariable;
    const netProfit = Math.max(0, totalRevenue - totalExpenses);

    const headPayout = netProfit * 0.25;
    const bdrPayout = netProfit * 0.25;
    const companyRetention = netProfit * 0.50;

    const fetchData = async () => {
        try {
            const [profilesRes, leadsRes] = await Promise.all([
                supabase.from('profiles').select('*').order('display_name', { ascending: true }),
                supabase.from('leads').select('*').order('name', { ascending: true })
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (leadsRes.error) throw leadsRes.error;

            setUsers(profilesRes.data || []);
            setLeads(leadsRes.data || []);
        } catch (error: any) {
            console.error("Erro ao buscar dados:", error);
        }
    };

    useEffect(() => {
        if (!loading && isAdmin) {
            fetchData();
        }
    }, [isAdmin, loading]);

    const handleAddPayment = () => {
        if (!newPayment.leadId || newPayment.amount <= 0) {
            toast.error("Selecione um lead e um valor válido");
            return;
        }

        const selectedLead = leads.find(l => l.id === newPayment.leadId);
        const bdr = users.find(u => u.user_id === selectedLead?.user_id);

        const payment: Payment = {
            id: crypto.randomUUID(),
            leadId: newPayment.leadId,
            leadName: selectedLead?.name || "Lead Desconhecido",
            bdrName: bdr?.display_name || bdr?.email || "BDR não vinculado",
            amount: newPayment.amount,
            date: new Date().toISOString()
        };

        setPayments([payment, ...payments]);
        setNewPayment({ leadId: "", amount: 0 });
        toast.success("Recebimento registrado!");
    };

    const handleAddExpense = () => {
        if (!newExpense.name || newExpense.amount <= 0) {
            toast.error("Preencha o nome e o valor do gasto");
            return;
        }

        const expense: Expense = {
            id: crypto.randomUUID(),
            ...newExpense,
            date: new Date().toISOString()
        };

        setExpenses([expense, ...expenses]);
        setNewExpense({ type: 'fixo', name: "", description: "", amount: 0 });
        toast.success("Gasto registrado!");
    };

    const removePayment = (id: string) => setPayments(payments.filter(p => p.id !== id));
    const removeExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));

    if (loading || !isAdmin) return null;

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <motion.div initial="hidden" animate="visible" variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-2xl">
                                <DollarSign className="h-8 w-8 text-primary" />
                            </div>
                            Gestão Financeira
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Controle de faturamento, gastos e distribuição de lucros em tempo real.</p>
                    </div>

                    <div className="flex bg-muted/30 p-1 rounded-2xl border border-primary/5">
                        <div className="px-4 py-2 text-center border-r border-primary/5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo Líquido</p>
                            <p className="text-lg font-black text-emerald-500">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="px-4 py-2 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Meta Mensal</p>
                            <p className="text-lg font-black text-foreground">85%</p>
                        </div>
                    </div>
                </motion.div>

                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-3 max-w-[600px] h-12 bg-muted/20 p-1 border border-primary/5 rounded-2xl">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <PieChart className="h-4 w-4 mr-2" />
                            Painel Canal de Vendas
                        </TabsTrigger>
                        <TabsTrigger value="receivables" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <Receipt className="h-4 w-4 mr-2" />
                            Pagamentos Leads
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase tracking-widest text-[10px]">
                            <Wallet className="h-4 w-4 mr-2" />
                            Gestão de Gastos
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
                                                <Badge variant="outline" className="mt-2 text-[8px] border-primary/20 uppercase">25% do Lucro</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-center p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all scale-110 shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/20">
                                            <Briefcase className="h-6 w-6 text-emerald-500 mx-auto" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Comissão BDR</p>
                                                <p className="text-xl font-black text-emerald-500">R$ {bdrPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <Badge variant="outline" className="mt-2 text-[8px] bg-emerald-500/10 border-emerald-500/20 text-emerald-500 uppercase">25% do Lucro</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-center p-6 rounded-3xl bg-secondary/20 border border-border group hover:bg-secondary/30 transition-all">
                                            <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Empresa</p>
                                                <p className="text-xl font-black">R$ {companyRetention.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <Badge variant="outline" className="mt-2 text-[8px] border-border uppercase">50% Retido</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border text-center">
                                        <p className="text-[10px] text-muted-foreground font-medium italic">"A regra de payout divide 50% do lucro entre a operação (Head e BDR) e retém 50% para reinvestimento."</p>
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
                                            {payments.slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-3 bg-background/40 rounded-2xl border border-border/50 group hover:border-emerald-500/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><Plus className="h-4 w-4 text-emerald-500" /></div>
                                                        <div>
                                                            <p className="text-sm font-bold">{p.leadName}</p>
                                                            <p className="text-[9px] text-muted-foreground uppercase font-black">BDR: {p.bdrName}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-emerald-500">R$ {p.amount.toLocaleString('pt-BR')}</p>
                                                </div>
                                            ))}
                                            {payments.length === 0 && (
                                                <div className="py-8 text-center opacity-40 italic text-xs">Nenhuma venda registrada este mês.</div>
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
                                            {expenses.slice(0, 3).map(e => (
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
                                            {expenses.length === 0 && (
                                                <div className="py-8 text-center opacity-40 italic text-xs">Nenhum gasto registrado.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
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
                                        <Select value={newPayment.leadId} onValueChange={(v) => setNewPayment(prev => ({ ...prev, leadId: v }))}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-background/50 border-primary/10 focus:ring-primary/20">
                                                <SelectValue placeholder="Selecione o Lead" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {leads.map(l => (
                                                    <SelectItem key={l.id} value={l.id} className="rounded-xl">{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-primary/5 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-6">Lead / Cliente</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Responsável (BDR)</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Valor Liq.</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 text-right px-6">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center text-muted-foreground opacity-50 italic">
                                                Nenhum recebimento registrado. Adicione o faturamento na lateral.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payments.map(p => (
                                            <TableRow key={p.id} className="group hover:bg-primary/5 border-primary/5 transition-colors">
                                                <TableCell className="py-6 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                                            <Briefcase className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-sm">{p.leadName}</span>
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(p.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-black">{p.bdrName}</Badge>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <span className="font-black text-emerald-500">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </TableCell>
                                                <TableCell className="py-6 text-right px-6">
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive active:scale-90 transition-all" onClick={() => removePayment(p.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
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
                                    {expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center text-muted-foreground opacity-50 italic">
                                                Nenhuma despesa lançada. Use o formulário à esquerda.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map(e => (
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
                        <p className="text-[11px] text-muted-foreground font-medium">As informações financeiras, recebimentos de leads e lançamentos de custos são protegidos por criptografia e visíveis apenas para Administradores Master da Nexora Intelligence.</p>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default Finance;

