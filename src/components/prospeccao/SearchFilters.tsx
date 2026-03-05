import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, MapPin, Search, Loader2 } from "lucide-react";

const NICHOS = [
  "Restaurantes", "Clínicas Médicas", "Escritórios de Advocacia", "Academias",
  "Salões de Beleza", "Imobiliárias", "Pet Shops", "Oficinas Mecânicas",
  "Escolas", "Consultórios Odontológicos", "Lojas de Roupas", "Padarias",
  "Farmácias", "Estúdios de Tatuagem", "Barbearias", "Fotógrafos",
  "Pizzarias", "Hamburgueria", "Cafeterias", "Sorveterias",
];

interface Props {
  niche: string;
  location: string;
  maxResults: string;
  minRating: string;
  loading: boolean;
  onNicheChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onMaxResultsChange: (v: string) => void;
  onMinRatingChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SearchFilters({
  niche, location, maxResults, minRating, loading,
  onNicheChange, onLocationChange, onMaxResultsChange, onMinRatingChange, onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4 lg:col-span-1 h-fit sticky top-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Filter className="h-4 w-4" /> Filtros de Busca
      </h3>

      <div className="space-y-2">
        <Label>Nicho / Segmento</Label>
        <Select value={niche} onValueChange={onNicheChange}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Selecione o nicho" />
          </SelectTrigger>
          <SelectContent>
            {NICHOS.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Localização</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ex: São Paulo, SP"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Máx. resultados</Label>
          <Select value={maxResults} onValueChange={onMaxResultsChange}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Avaliação mín.</Label>
          <Select value={minRating} onValueChange={onMinRatingChange}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Qualquer</SelectItem>
              <SelectItem value="3">3+ ⭐</SelectItem>
              <SelectItem value="4">4+ ⭐</SelectItem>
              <SelectItem value="4.5">4.5+ ⭐</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading || !niche || !location}>
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Buscando com IA...</>
        ) : (
          <><Search className="h-4 w-4" /> Buscar Empresas</>
        )}
      </Button>
    </form>
  );
}
