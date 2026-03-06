import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
    Users,
    UserPlus,
    ShieldCheck,
    Mail,
    Trash2,
    MoreHorizontal,
    UserCheck,
    Clock,
    Shield
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
    const { isAdmin, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !isAdmin) {
            navigate("/");
            toast.error("Acesso negado", {
                description: "Você não tem permissão para acessar o painel administrativo."
            });
        }
    }, [isAdmin, loading, navigate]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: "",
        email: "",
        role: "employee"
    });

    if (loading || !isAdmin) {
        return null;
    }

    // Mock data for the interface
    const employees = [
        {
            id: "1",
            name: "Huguinho",
            email: "huguinhoask@gmail.com",
            role: "admin",
            status: "active",
            joinedAt: "01/03/2026"
        },
        {
            id: "2",
            name: "João Silva",
            email: "joao.vendedor@nexora.app",
            role: "employee",
            status: "active",
            joinedAt: "04/03/2026"
        },
        {
            id: "3",
            name: "Maria Souza",
            email: "maria.suporte@nexora.app",
            role: "employee",
            status: "pending",
            joinedAt: "05/03/2026"
        },
    ];

    const handleCreateEmployee = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // 1. Enviar o convite oficial do Supabase
            // Nota: No Supabase, o convite cria o usuário e envia o e-mail de confirmação.
            // O usuário ficará com status 'pending' até confirmar o e-mail.
            const { data, error } = await supabase.auth.admin.inviteUserByEmail(newEmployee.email, {
                data: {
                    display_name: newEmployee.name,
                    role: newEmployee.role
                },
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) {
                // Se o erro for de 'admin privileges', explicamos que precisa de configuração no dashboard
                if (error.status === 403) {
                    toast.error("Erro de Permissão", {
                        description: "Para enviar convites, você precisa da 'Service Role Key' configurada ou usar o dashboard do Supabase.",
                    });
                } else {
                    throw error;
                }
                return;
            }

            toast.success(`Convite enviado para ${newEmployee.email}!`, {
                description: "O funcionário receberá um e-mail para ativar a conta.",
            });

            setIsDialogOpen(false);
            setNewEmployee({ name: "", email: "", role: "employee" });
        } catch (error: any) {
            console.error("Erro ao convidar:", error);
            toast.error("Falha ao enviar convite", {
                description: error.message || "Ocorreu um erro inesperado."
            });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <DashboardLayout>
            <motion.div
                className="space-y-6 max-w-[1400px]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                            Painel Administrativo
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie acessos, controle funcionários e monitore o sistema.
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Novo Funcionário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card border-primary/10 backdrop-blur-xl">
                            <form onSubmit={handleCreateEmployee}>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 tracking-tight text-xl">
                                        <UserPlus className="h-5 w-5 text-primary" />
                                        Adicionar Funcionário
                                    </DialogTitle>
                                    <DialogDescription>
                                        Envie um convite de acesso para um novo membro da sua equipe.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                                        <Input
                                            id="name"
                                            placeholder="Ex: Carlos Oliveira"
                                            className="bg-background/50 border-primary/10 focus:border-primary/30 transition-all"
                                            value={newEmployee.name}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail Corporativo</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="email@empresa.com"
                                            className="bg-background/50 border-primary/10 focus:border-primary/30 transition-all"
                                            value={newEmployee.email}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível de Acesso</Label>
                                        <Select
                                            value={newEmployee.role}
                                            onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                                        >
                                            <SelectTrigger className="bg-background/50 border-primary/10">
                                                <SelectValue placeholder="Selecione um cargo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-primary/10 backdrop-blur-xl">
                                                <SelectItem value="employee" className="focus:bg-primary/10">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span>Funcionário (Vendedor)</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="admin" className="focus:bg-primary/10">
                                                    <div className="flex items-center gap-2 text-primary font-medium">
                                                        <Shield className="h-4 w-4" />
                                                        <span>Administrador</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-primary/5">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="bg-primary hover:bg-primary/90 px-8">
                                        Enviar Convite
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </motion.div>

                {/* Stats Summary */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center uppercase tracking-widest text-[10px]">
                                Total de Usuários
                                <Users className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">12</div>
                            <p className="text-xs text-muted-foreground mt-1">+2 novos esta semana</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center uppercase tracking-widest text-[10px]">
                                Admins
                                <ShieldCheck className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">1</div>
                            <p className="text-xs text-primary/70 font-medium mt-1 truncate">huguinhoask@gmail.com</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center uppercase tracking-widest text-[10px]">
                                Convites Pendentes
                                <Clock className="h-4 w-4 text-amber-500/40 group-hover:text-amber-500 transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">3</div>
                            <p className="text-xs text-muted-foreground mt-1">Aguardando ativação</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* User Table */}
                <motion.div variants={itemVariants}>
                    <Card className="border-primary/10 bg-card/30 backdrop-blur-md overflow-hidden">
                        <CardHeader className="border-b border-primary/5 bg-muted/20">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2 tracking-tight">
                                <Users className="h-5 w-5 text-primary" />
                                Equipe Nexora
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-primary/5">
                                        <TableHead className="text-xs uppercase tracking-wider py-4">Funcionário</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider py-4">Cargo</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider py-4">Status</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider py-4">Membro desde</TableHead>
                                        <TableHead className="text-right text-xs uppercase tracking-wider py-4">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map((employee) => (
                                        <TableRow key={employee.id} className="hover:bg-primary/5 transition-colors border-primary/5 group">
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{employee.name}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground/70 transition-colors">
                                                        <Mail className="h-3 w-3" />
                                                        {employee.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {employee.role === 'admin' ? (
                                                    <Badge variant="default" className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold px-3 border-transparent">Administrador</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium px-3 border-primary/5">Funcionário</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {employee.status === 'active' ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-full w-fit">
                                                        <UserCheck className="h-3 w-3" />
                                                        ATIVO
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-full w-fit">
                                                        <Clock className="h-3 w-3" />
                                                        PENDENTE
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground font-medium">
                                                {employee.joinedAt}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 bg-card border-primary/10 backdrop-blur-xl">
                                                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Ações</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-primary/5" />
                                                        <DropdownMenuItem className="cursor-pointer focus:bg-primary/10">Editar Permissões</DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer focus:bg-primary/10">Redefinir Senha</DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-primary/5" />
                                                        <DropdownMenuItem className="text-destructive cursor-pointer focus:bg-destructive/10">
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remover Acesso
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Help section */}
                <motion.div variants={itemVariants} className="bg-muted/20 border border-primary/5 rounded-xl p-5 flex gap-5 items-center backdrop-blur-sm">
                    <div className="bg-primary/10 p-3 rounded-full shadow-inner">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-widest text-[11px]">Dica de Segurança</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Apenas você (<span className="text-primary/80 font-semibold">huguinhoask@gmail.com</span>) possui autorização para excluir outros administradores ou alterar permissões críticas do sistema.</p>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Admin;
