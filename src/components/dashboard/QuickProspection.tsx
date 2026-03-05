import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuickProspection() {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (niche) params.set("niche", niche);
    if (city) params.set("city", city);
    navigate(`/prospeccao?${params.toString()}`);
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Prospecção Rápida</h3>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Nicho (ex: Pizzaria, Barbearia...)"
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade (ex: São Paulo)"
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Button onClick={handleSearch} className="w-full gap-2" disabled={!niche.trim()}>
          <Search className="h-4 w-4" /> Buscar Agora
        </Button>
      </div>
    </div>
  );
}
