import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, Globe, Save, ExternalLink, ShieldCheck, ShieldAlert, Shield, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { ProspectResult } from "@/lib/api/prospect";

const CONFIDENCE_MAP = {
  high: { label: "Alta confiança", icon: ShieldCheck, class: "text-primary" },
  medium: { label: "Média", icon: Shield, class: "text-warning" },
  low: { label: "Baixa", icon: ShieldAlert, class: "text-muted-foreground" },
};

interface Props {
  result: ProspectResult;
  saved: boolean;
  onSave: () => void;
  canSave?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary";
  if (score >= 50) return "text-warning";
  return "text-muted-foreground";
}

export const ProspectCard = React.forwardRef<HTMLDivElement, Props>(({ result: r, saved, onSave, canSave = true }, ref) => {
  const conf = CONFIDENCE_MAP[r.confidence] || CONFIDENCE_MAP.medium;
  const ConfIcon = conf.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 card-hover"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground">{r.name}</h3>
            <Badge variant="outline" className={`text-[10px] ${r.open ? "border-primary/30 text-primary" : "border-destructive/30 text-destructive"}`}>
              {r.open ? "Aberto" : "Fechado"}
            </Badge>
            {r.category && (
              <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
            )}
            <span className={`text-xs font-bold ${getScoreColor(r.score)}`}>
              Score: {r.score}
            </span>
            <span className={`flex items-center gap-0.5 text-[10px] ${conf.class}`} title={conf.label}>
              <ConfIcon className="h-3 w-3" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{r.address}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-warning fill-warning" />
              {r.rating} ({r.reviews})
            </span>
            {r.phone && (
              <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Phone className="h-3 w-3" /> {r.phone}
              </a>
            )}
            {r.website && (
              <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Globe className="h-3 w-3" /> {r.website}
              </a>
            )}
            {r.hours && <span className="text-muted-foreground/70">{r.hours}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 border-border gap-1.5" asChild>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(r.name + " " + r.address)}`}
              target="_blank"
              rel="noopener"
            >
              <MapPin className="h-3.5 w-3.5" /> Maps
            </a>
          </Button>
          {r.website && (
            <Button variant="outline" size="sm" className="h-8 border-border" asChild>
              <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noopener">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button size="sm" className="h-8 gap-1.5" disabled={saved} onClick={onSave}>
            <Save className="h-3.5 w-3.5" />
            {saved ? "Salvo" : canSave ? "Salvar Lead" : "Entrar para salvar"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

ProspectCard.displayName = "ProspectCard";
