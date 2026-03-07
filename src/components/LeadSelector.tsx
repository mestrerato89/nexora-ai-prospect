import * as React from "react";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface LeadSelectorProps {
    leads: any[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function LeadSelector({ leads, value, onValueChange, placeholder = "Selecione o lead...", className }: LeadSelectorProps) {
    const [open, setOpen] = React.useState(false);

    const selectedLead = leads.find((lead) => lead.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-12 rounded-2xl bg-background/50 border-primary/10 font-bold px-4",
                        className
                    )}
                >
                    <span className="truncate flex items-center gap-2">
                        {selectedLead ? (
                            <>
                                <User className="h-4 w-4 text-primary shrink-0" />
                                {selectedLead.name}
                            </>
                        ) : (
                            <span className="text-muted-foreground font-medium">{placeholder}</span>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] rounded-2xl overflow-hidden border-primary/10 shadow-2xl" side="bottom" align="start">
                <Command className="bg-card">
                    <CommandInput placeholder="Pesquisar nome do lead..." className="h-12 border-none focus:ring-0" />
                    <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">Nenhum lead encontrado.</CommandEmpty>
                        <CommandGroup>
                            {leads.map((lead) => (
                                <CommandItem
                                    key={lead.id}
                                    value={lead.name}
                                    onSelect={() => {
                                        onValueChange(lead.id === value ? "" : lead.id);
                                        setOpen(false);
                                    }}
                                    className="mx-2 my-1 rounded-xl cursor-pointer py-3 px-4 font-bold data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground group transition-all"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-data-[selected=true]:bg-white/20">
                                                <User className="h-4 w-4 text-primary group-data-[selected=true]:text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{lead.name}</span>
                                                {lead.city && <span className="text-[10px] opacity-60 font-medium">{lead.city}</span>}
                                            </div>
                                        </div>
                                        <Check
                                            className={cn(
                                                "h-4 w-4",
                                                value === lead.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
