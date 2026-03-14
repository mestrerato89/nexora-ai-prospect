import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
    Users,
    ShieldCheck,
    MoreHorizontal,
    Clock,
    Trash2,
    Eye,
    EyeOff,
    Zap
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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

    const [users, setUsers] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);

    const fetchUsers = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            console.error("Erro ao buscar usuários:", error);
            toast.error("Erro ao carregar equipe");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, loading]);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole } as any)
                .eq('user_id', userId);

            if (error) throw error;

            const roleLabel = newRole === 'admin' ? 'Admin' : newRole === 'head_operacional' ? 'Head Comercial' : 'BDR';
            toast.success(`Cargo atualizado!`, {
                description: `O usuário agora é um ${roleLabel}.`
            });
            fetchUsers();
        } catch (error: any) {
            toast.error("Erro ao atualizar cargo", { description: error.message });
        }
    };

    const handleUpdatePermission = async (userId: string, currentPermission: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ can_view_all_leads: !currentPermission } as any)
                .eq('user_id', userId);

            if (error) throw error;

            toast.success(`Permissão atualizada!`, {
                description: !currentPermission ? "Agora o usuário pode ver todos os leads." : "Agora o usuário vê apenas os próprios leads."
            });
            fetchUsers();
        } catch (error: any) {
            toast.error("Erro ao atualizar permissão", { description: error.message });
        }
    };


    const handleResetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;

            toast.success("E-mail enviado!", {
                description: `Um link de redefinição foi enviado para ${email}.`
            });
        } catch (error: any) {
            let msg = error.message;
            if (msg.includes("For security purposes")) {
                msg = "Por motivos de segurança, aguarde alguns segundos antes de solicitar novamente.";
            }
            toast.error("Erro ao solicitar redefinição", { description: msg });
        }
    };

    const handleRemoveUser = async (userId: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o acesso de ${name}? Esta ação não pode ser desfeita.`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            toast.success("Acesso removido", {
                description: `${name} foi removido da lista de equipe.`
            });
            fetchUsers();
        } catch (error: any) {
            toast.error("Erro ao remover usuário", { description: error.message });
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    if (loading || !isAdmin) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <motion.div initial="hidden" animate="visible" variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-7 w-7 text-primary" />
                            Gestão de Equipe
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">Controle de acessos e permissões administrativas.</p>
                    </div>
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center uppercase tracking-widest text-[10px]">
                                Total de Usuários
                                <Users className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">{users.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Membros cadastrados</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center uppercase tracking-widest text-[10px]">
                                Gestores & Liderança
                                <ShieldCheck className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">
                                {users.filter(u => u.role === 'admin' || (u as any).role === 'head_operacional').length}
                            </div>
                            <p className="text-xs text-primary/70 font-medium mt-1">Admins e Heads</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/20 transition-all group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center uppercase tracking-widest text-[10px]">
                                Pendentes
                                <Clock className="h-4 w-4 text-amber-500/40 group-hover:text-amber-500 transition-colors" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">
                                {users.filter(u => !u.display_name).length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Aguardando login</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial="hidden" animate="visible" variants={itemVariants}>
                    <Card className="border-primary/10 bg-card/30 backdrop-blur-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-primary/5">
                                    <TableHead className="text-xs uppercase tracking-wider py-4">Funcionário</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider py-4">Cargo</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider py-4">Status</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider py-4 text-center">Visão</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider py-4">Membro desde</TableHead>
                                    <TableHead className="text-right text-xs uppercase tracking-wider py-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fetching ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-10">Carregando...</TableCell></TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-10">Vazio</TableCell></TableRow>
                                ) : users.map((employee) => (
                                    <TableRow key={employee.id} className="hover:bg-primary/5 border-primary/5 group">
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{employee.display_name || employee.email.split('@')[0]}</span>
                                                <span className="text-xs text-muted-foreground">{employee.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={employee.role === 'admin' ? "default" : employee.role === 'head_operacional' ? "outline" : "secondary"} className={employee.role === 'head_operacional' ? "border-primary text-primary" : ""}>
                                                {employee.role === 'admin' ? 'Admin' : employee.role === 'head_operacional' ? 'Head Comercial' : 'BDR'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${employee.display_name ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                                                {employee.display_name ? 'ATIVO' : 'PENDENTE'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {employee.can_view_all_leads ? (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all cursor-default flex items-center gap-1 text-[9px] font-black uppercase">
                                                        <Eye className="h-3 w-3" /> Total
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground border-border flex items-center gap-1 text-[9px] font-black uppercase">
                                                        <EyeOff className="h-3 w-3" /> Privada
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium opacity-70">
                                            {new Date(employee.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Mudar Cargo para:</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(employee.user_id, 'admin')} className="text-primary font-bold">
                                                        Admin (Total)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(employee.user_id, 'head_operacional')}>
                                                        Head Comercial
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(employee.user_id, 'bdr')}>
                                                        BDR (Prospector)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Permissões:</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleUpdatePermission(employee.user_id, employee.can_view_all_leads)} className="font-bold">
                                                        {employee.can_view_all_leads ? (
                                                            <span className="flex items-center gap-2 text-amber-500"><EyeOff className="h-4 w-4" /> Restringir para Leads Próprios</span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 text-emerald-500"><Eye className="h-4 w-4" /> Liberar Visão de Todos os Leads</span>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem onClick={() => handleResetPassword(employee.email)}>
                                                        Resetar Senha
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleRemoveUser(employee.user_id, employee.display_name || employee.email)}>
                                                        Remover Acesso
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </motion.div>

                {/* Help section */}
                <motion.div initial="hidden" animate="visible" variants={itemVariants} className="bg-muted/10 border border-primary/5 rounded-2xl p-4 flex gap-4 items-center backdrop-blur-sm">
                    <div className="bg-primary/5 p-2 rounded-xl shadow-inner">
                        <ShieldCheck className="h-5 w-5 text-primary/60" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black tracking-[0.2em] text-foreground uppercase opacity-80">Ambiente Administrativo</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">As informações de equipe e cargos são visíveis apenas para Administradores Master.</p>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default Admin;
