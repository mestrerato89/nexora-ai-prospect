import { FolderOpen } from "lucide-react";

export function RecentProjects() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-foreground">Projetos Recentes</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-8">
        <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum projeto salvo ainda</p>
      </div>
    </div>
  );
}
