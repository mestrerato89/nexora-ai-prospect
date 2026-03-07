import {
  Sparkles,
  Search,
  Zap,
  FileText,
  Layout,
  BookOpen,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NewsItem {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

const newsItems: NewsItem[] = [
  {
    title: "Gemini 3 Flash no Assistente",
    description: "IA de última geração do Google para respostas mais rápidas e inteligentes.",
    icon: Sparkles,
    badge: "Novo",
    badgeColor: "bg-info/20 text-info",
  },
  {
    title: "Prospector de Serviços",
    description: "Encontre clientes que já estão procurando seus serviços na internet.",
    icon: Search,
    badge: "Plus",
    badgeColor: "bg-primary/20 text-primary",
  },
  {
    title: "Prompts com IA Generativa",
    description: "Prompts técnicos gerados automaticamente com Gemini para cada nicho.",
    icon: Zap,
  },
  {
    title: "Scripts de Abordagem",
    description: "Mensagens personalizadas com elogios reais e dores específicas do lead.",
    icon: FileText,
  },
  {
    title: "Catálogo de Sites/LPs",
    description: "Modelos prontos de landing pages e sites para vender aos clientes.",
    icon: Layout,
  },
  {
    title: "Biblioteca de Estudos",
    description: "Guias e manuais práticos para vender apps e usar a Nexora.",
    icon: BookOpen,
  },
];

export function NewsSection() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">
          Novidades da Nexora 🚀
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Confira o que há de novo na plataforma
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {newsItems.map((item) => (
          <div
            key={item.title}
            className="bg-card rounded-xl p-5 card-hover border border-border cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
