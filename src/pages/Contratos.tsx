import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download, ArrowLeft, User, Building2, ClipboardList, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const TEMPLATES = [
  { id: "software", title: "Desenvolvimento de Software", emoji: "💻", desc: "App, site, sistema web ou mobile" },
  { id: "servicos", title: "Prestação de Serviços Digitais", emoji: "🌐", desc: "Marketing, design, consultoria digital" },
  { id: "consultoria", title: "Consultoria / Mentoria", emoji: "🎯", desc: "Consultoria profissional ou mentoria" },
  { id: "licenciamento", title: "Licenciamento de Software", emoji: "📋", desc: "Licença de uso de software SaaS" },
];

type PersonType = "fisica" | "juridica";

export default function Contratos() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [contratadoType, setContratadoType] = useState<PersonType>("fisica");
  const [contratanteType, setContratanteType] = useState<PersonType>("fisica");
  const [fields, setFields] = useState({
    nomeContratado: "", docContratado: "", enderecoContratado: "",
    nomeContratante: "", docContratante: "", enderecoContratante: "",
    valor: "", formaPagamento: "50% na assinatura do contrato e 50% na entrega final do projeto.", prazoDias: "30 dias úteis", cidadeForo: "",
    descricaoServico: "",
  });
  const [polishingField, setPolishingField] = useState<string | null>(null);

  const polishWithAI = async (fieldKey: string) => {
    const text = fields[fieldKey as keyof typeof fields];
    if (!text || text.trim().length < 5) {
      toast.error("Escreva algo antes de ajustar com IA");
      return;
    }
    setPolishingField(fieldKey);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexora-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Reescreva o texto abaixo para linguagem jurídica profissional de contrato brasileiro. Corrija erros gramaticais, melhore a clareza e use termos formais adequados. Retorne APENAS o texto corrigido, sem explicações:\n\n"${text}"`
          }],
        }),
      });
      if (!resp.ok) throw new Error("Erro");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buf = "", result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try { const c = JSON.parse(j).choices?.[0]?.delta?.content; if (c) result += c; } catch {}
        }
      }
      if (result.trim()) {
        set(fieldKey, result.trim().replace(/^[""]|[""]$/g, ""));
        toast.success("Texto ajustado com IA!");
      }
    } catch { toast.error("Erro ao ajustar com IA"); }
    setPolishingField(null);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setFields((prev) => ({ ...prev, nomeContratado: data.display_name || "" }));
      }
    });
  }, [user]);

  const set = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const tpl = useMemo(() => TEMPLATES.find((t) => t.id === selectedTemplate), [selectedTemplate]);

  const contractPreview = useMemo(() => {
    const title = tpl?.title?.toUpperCase() || "PRESTAÇÃO DE SERVIÇOS";
    const docLabelContratado = contratadoType === "fisica" ? "CPF" : "CNPJ";
    const docLabelContratante = contratanteType === "fisica" ? "CPF" : "CNPJ";
    const blank = "________________________";

    return `CONTRATO DE ${title}

Pelo presente instrumento particular, as partes:

CONTRATADO(A):
${fields.nomeContratado || blank}, inscrito(a) no ${docLabelContratado} sob nº ${fields.docContratado || blank}, residente e domiciliado em ${fields.enderecoContratado || blank}.

CONTRATANTE:
${fields.nomeContratante || blank}, inscrito(a) no ${docLabelContratante} sob nº ${fields.docContratante || blank}, residente e domiciliado em ${fields.enderecoContratante || blank}.

Têm entre si, justo e contratado, o seguinte:

CLÁUSULA 1ª — DO OBJETO: O presente contrato tem como objeto a prestação de serviços de ${tpl?.title?.toLowerCase() || "desenvolvimento de software"}, consistindo em: ${fields.descricaoServico || "Desenvolvimento de aplicativo/site personalizado conforme especificações acordadas entre as partes."}.

CLÁUSULA 2ª — DO VALOR E PAGAMENTO: Pela prestação dos serviços descritos, o CONTRATANTE pagará ao CONTRATADO(A) o valor total de R$ ${fields.valor || blank}, conforme a seguinte forma de pagamento: ${fields.formaPagamento}.

CLÁUSULA 3ª — DO PRAZO: O prazo para a entrega do projeto será de ${fields.prazoDias}, contados a partir da assinatura deste contrato e do recebimento do pagamento inicial.

CLÁUSULA 4ª — DAS OBRIGAÇÕES DO CONTRATADO: O CONTRATADO se compromete a executar os serviços com zelo, diligência e dentro dos padrões técnicos aplicáveis, entregando o resultado conforme especificações acordadas.

CLÁUSULA 5ª — DAS OBRIGAÇÕES DO CONTRATANTE: O CONTRATANTE se compromete a fornecer todas as informações e materiais necessários para a execução dos serviços, bem como efetuar os pagamentos nas datas acordadas.

CLÁUSULA 6ª — DA CONFIDENCIALIDADE: As partes se comprometem a manter sigilo sobre todas as informações confidenciais trocadas durante a vigência deste contrato.

CLÁUSULA 7ª — DA PROPRIEDADE INTELECTUAL: Todos os direitos de propriedade intelectual sobre os trabalhos desenvolvidos serão transferidos ao CONTRATANTE após o pagamento integral.

CLÁUSULA 8ª — DA RESCISÃO: O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de 15 (quinze) dias, ficando a parte que der causa à rescisão responsável pelo pagamento de eventuais perdas e danos.

CLÁUSULA 9ª — DO FORO: Fica eleito o foro da comarca de ${fields.cidadeForo || blank} para dirimir quaisquer dúvidas oriundas do presente contrato.

E, por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor.

${fields.cidadeForo || blank}, _____ de _______________ de _______.


_________________________________
CONTRATADO(A): ${fields.nomeContratado || blank}


_________________________________
CONTRATANTE: ${fields.nomeContratante || blank}`;
  }, [fields, tpl, contratadoType, contratanteType]);

  const handleDownloadPDF = () => {
    const blob = new Blob([contractPreview], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contrato-${tpl?.id || "documento"}.txt`;
    a.click();
    toast.success("Contrato baixado!");
  };

  // Template selection
  if (!selectedTemplate) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-[900px]">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Contratos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Escolha um modelo para gerar seu contrato</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map((t) => (
              <motion.button key={t.id} onClick={() => setSelectedTemplate(t.id)} whileHover={{ y: -2 }}
                className="bg-card rounded-xl border border-border p-6 text-left card-hover group">
                <span className="text-4xl mb-3 block">{t.emoji}</span>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{t.title}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const PersonToggle = ({ value, onChange }: { value: PersonType; onChange: (v: PersonType) => void }) => (
    <div className="flex rounded-lg overflow-hidden border border-border">
      <button
        onClick={() => onChange("fisica")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${value === "fisica" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
      >
        <User className="h-4 w-4" /> Pessoa Física
      </button>
      <button
        onClick={() => onChange("juridica")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${value === "juridica" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
      >
        <Building2 className="h-4 w-4" /> Pessoa Jurídica
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Novo Contrato</h1>
        </div>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" /> Baixar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Form */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto">
          <div>
            <h2 className="text-lg font-bold text-foreground">Dados do Contrato</h2>
            <p className="text-sm text-muted-foreground">Preencha os campos abaixo para gerar o documento.</p>
          </div>

          {/* Section 1: Contratado */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> 1. Seus Dados (Contratado)
            </h3>
            <PersonToggle value={contratadoType} onChange={setContratadoType} />
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
              <Input value={fields.nomeContratado} onChange={(e) => set("nomeContratado", e.target.value)} placeholder="Ex: João da Silva" className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{contratadoType === "fisica" ? "CPF" : "CNPJ"}</Label>
              <Input value={fields.docContratado} onChange={(e) => set("docContratado", e.target.value)} placeholder={contratadoType === "fisica" ? "Ex: 000.000.000-00" : "Ex: 00.000.000/0001-00"} className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Endereço Completo</Label>
              <Input value={fields.enderecoContratado} onChange={(e) => set("enderecoContratado", e.target.value)} placeholder="Ex: Rua das Flores, 123" className="bg-secondary border-border mt-1" />
            </div>
          </div>

          {/* Section 2: Contratante */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> 2. Dados do Cliente
            </h3>
            <PersonToggle value={contratanteType} onChange={setContratanteType} />
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
              <Input value={fields.nomeContratante} onChange={(e) => set("nomeContratante", e.target.value)} placeholder="Ex: Maria Souza" className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{contratanteType === "fisica" ? "CPF" : "CNPJ"}</Label>
              <Input value={fields.docContratante} onChange={(e) => set("docContratante", e.target.value)} placeholder={contratanteType === "fisica" ? "Ex: 000.000.000-00" : "Ex: 00.000.000/0001-00"} className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Endereço Completo</Label>
              <Input value={fields.enderecoContratante} onChange={(e) => set("enderecoContratante", e.target.value)} placeholder="Ex: Av. Brasil, 456" className="bg-secondary border-border mt-1" />
            </div>
          </div>

          {/* Section 3: Detalhes do Serviço */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> 3. Detalhes do Serviço
            </h3>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição do Serviço</Label>
              <Textarea value={fields.descricaoServico} onChange={(e) => set("descricaoServico", e.target.value)} placeholder="Desenvolvimento de aplicativo/site personalizado conforme especificações acordadas entre as partes." className="bg-secondary border-border mt-1 resize-none h-24" />
              {fields.descricaoServico.trim().length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => polishWithAI("descricaoServico")}
                  disabled={polishingField === "descricaoServico"}
                  className="mt-2 gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  {polishingField === "descricaoServico" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Ajustar com IA
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor Total (R$)</Label>
                <Input value={fields.valor} onChange={(e) => set("valor", e.target.value)} placeholder="Ex: 2.500,00" className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prazo de Entrega</Label>
                <Input value={fields.prazoDias} onChange={(e) => set("prazoDias", e.target.value)} className="bg-secondary border-border mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
              <Input value={fields.formaPagamento} onChange={(e) => set("formaPagamento", e.target.value)} className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cidade / Foro</Label>
              <Input value={fields.cidadeForo} onChange={(e) => set("cidadeForo", e.target.value)} placeholder="Ex: São Paulo - SP" className="bg-secondary border-border mt-1" />
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3 sticky top-4">
          <p className="text-sm text-muted-foreground font-medium">Pré-visualização do Contrato</p>
          <div className="bg-card rounded-xl border border-border p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-serif leading-relaxed">
              {contractPreview}
            </pre>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
