import { DashboardLayout } from "@/components/DashboardLayout";
import { BookOpen, CheckCircle, Play, FileText, Users, Lightbulb, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { title: "Faça login com seu e-mail de compra", desc: "Acesse a plataforma usando o mesmo e-mail cadastrado na compra.", icon: "1" },
  { title: "Escolha 'Novo Aplicativo' ou 'Novo Site / LP'", desc: "No menu lateral ou no Dashboard, selecione o tipo de projeto que deseja criar.", icon: "2" },
  { title: "Selecione o nicho do seu projeto", desc: "Navegue pelo catálogo de nichos disponíveis e escolha o que melhor se encaixa.", icon: "3" },
  { title: "Personalize nome e cores", desc: "Defina o nome do aplicativo/site, escolha cores e funcionalidades extras.", icon: "4" },
  { title: "Gere o prompt com IA", desc: "Clique em 'Gerar App' ou 'Gerar Site' e aguarde a IA criar o prompt técnico.", icon: "5" },
  { title: "Copie e cole na Lovable", desc: "Copie o prompt gerado e cole na Lovable para construir seu projeto automaticamente.", icon: "6" },
];

const materials = [
  { title: "Como Usar a Plataforma", desc: "Guia completo de todas as ferramentas disponíveis", icon: BookOpen, badge: "Guia" },
  { title: "Como Encontrar Clientes", desc: "Estratégias práticas para vender apps com IA", icon: Users, badge: "Estratégia" },
  { title: "Lovable — Transforme Ideias em Produtos", desc: "Tutorial completo da ferramenta Lovable", icon: Rocket, badge: "Tutorial" },
  { title: "Manual Prático de Vendas", desc: "Scripts de abordagem e respostas para objeções", icon: FileText, badge: "Manual" },
  { title: "Como Usar a Nexora", desc: "Guia completo da plataforma Nexora Intelligence", icon: Lightbulb, badge: "Guia" },
];

export default function AreaEstudos() {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-[1400px]"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Área de Estudos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Materiais exclusivos para dominar a venda de apps com IA</p>
        </div>

        {/* Tutorial steps */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-1">Como Usar a Nexora</h2>
          <p className="text-sm text-muted-foreground mb-6">Tutorial rápido em 6 passos</p>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-start group"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {step.icon}
                </div>
                <div className="flex-1 pb-4 border-b border-border last:border-0">
                  <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Como Usar Cada Função</h2>
          <p className="text-sm text-muted-foreground mb-4">Materiais complementares para aprofundar seu conhecimento</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <div key={m.title} className="bg-card rounded-xl border border-border p-5 card-hover cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{m.title}</h3>
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">{m.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium">
                  <Play className="h-3 w-3" /> Acessar material
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
