import { Crosshair, Smartphone, Globe, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "Nova Prospecção", icon: Crosshair, url: "/prospeccao" },
  { label: "Criar App", icon: Smartphone, url: "/novo-app" },
  { label: "Criar Site/LP", icon: Globe, url: "/novo-site" },
  { label: "Assistente IA", icon: Bot, url: "/assistente" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          className="gap-2 border-border hover:bg-accent text-sm"
          onClick={() => navigate(action.url)}
        >
          <action.icon className="h-4 w-4 text-primary" />
          {action.label}
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </Button>
      ))}
    </div>
  );
}
