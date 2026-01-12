"use client";

import { Download, Eye, Lock, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { deleteCreativeAction } from "@/actions/creative/creative.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { UploadCreativeDialog } from "./upload-creative-dialog";

interface Creative {
  id: string;
  title: string | null;
  key: string;
  url: string;
  createdAt: Date;
}

interface CriativosProps {
  creatives: Creative[];
  isAdmin: boolean;
  hasAccess: boolean;
}

export function CreativeCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <div className="relative aspect-square w-full bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
      <CardHeader className="p-4">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardFooter className="flex justify-between gap-2 p-4 pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </CardFooter>
    </Card>
  );
}

function CreativeCard({
  creative,
  isAdmin,
  onPreview,
  onDelete,
}: {
  creative: Creative;
  isAdmin: boolean;
  onPreview: (creative: Creative) => void;
  onDelete: (creative: Creative) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md border-border/50 pt-0">
      <div className="relative aspect-square w-full cursor-pointer overflow-hidden bg-muted">
        {isLoading && (
          <Skeleton className="absolute inset-0 z-10 h-full w-full" />
        )}
        <Image
          src={creative.url}
          alt={creative.title || "Criativo"}
          fill
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-105",
            isLoading ? "opacity-0" : "opacity-100",
          )}
          onLoad={() => setIsLoading(false)}
        />
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </div>
      <CardHeader>
        <CardTitle className="truncate text-base font-medium">
          {creative.title || "Sem título"}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" asChild className="h-8 w-8">
            <a href={creative.url} target="_blank" download title="Baixar">
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(creative)}
            title="Visualizar"
            className="h-8 text-xs"
          >
            Visualizar
            <Eye className="ml-2 h-3 w-3" />
          </Button>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(creative)}
            title="Excluir"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

const Criativos = ({ creatives, isAdmin, hasAccess }: CriativosProps) => {
  const isMobile = useIsMobile();
  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null);
  const [deleteCreative, setDeleteCreative] = useState<Creative | null>(null);

  if (!hasAccess) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="absolute inset-0 z-0">
          {isMobile ? (
            <Image
              src="/assets/images/criativos-img-mob.jpg"
              alt="Mobile Hero"
              fill
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <Image
              src="/assets/images/criativos-img-desk.jpg"
              alt="Desktop Hero"
              fill
              className="object-cover opacity-90"
              priority
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content - Text */}
        <div className="relative z-10 flex h-full w-full max-w-4xl flex-col justify-center space-y-8 p-8 text-white md:p-12 lg:p-16">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight drop-shadow-lg md:text-4xl lg:text-5xl">
              Impulsione seu <br className="hidden lg:block" />
              <span className="text-blue-400">negócio de limpeza de nome</span>{" "}
              com posts prontos!
            </h1>
            <p className="max-w-2xl text-lg text-gray-200 drop-shadow-md md:text-xl">
              Tenha acesso a uma biblioteca exclusiva de criativos persuasivos e
              altamente estratégicos. É só baixar e postar.
            </p>
          </div>

          <div>
            <Button
              className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
              size="lg"
            >
              <Lock className="h-4 w-4" />
              Disponível apenas para usuários ativos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active/Admin View (Gallery)
  async function handleDelete() {
    if (!deleteCreative) return;

    const result = await deleteCreativeAction(
      deleteCreative.id,
      deleteCreative.key,
    );
    if (result.success) {
      toast.success("Criativo excluído com sucesso");
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
    setDeleteCreative(null);
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Galeria de Criativos
          </h2>
          <p className="text-muted-foreground">
            Gerencie e baixe os materiais de divulgação.
          </p>
        </div>
        {isAdmin && <UploadCreativeDialog />}
      </div>

      {creatives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center animate-in fade-in-50">
          <div className="rounded-full bg-muted p-4">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            Nenhum criativo encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            Não há criativos disponíveis para exibição no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {creatives.map((creative) => (
            <CreativeCard
              key={creative.id}
              creative={creative}
              isAdmin={isAdmin}
              onPreview={setPreviewCreative}
              onDelete={setDeleteCreative}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!previewCreative}
        onOpenChange={(open) => !open && setPreviewCreative(null)}
      >
        <DialogContent className="max-w-5xl overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              {previewCreative?.title || "Visualização"}
            </DialogTitle>
          </DialogHeader>

          <div className="relative flex h-[60vh] w-full items-center justify-center bg-muted/30 p-4 md:h-[70vh]">
            {previewCreative && (
              <div className="relative h-full w-full">
                <Image
                  src={previewCreative.url}
                  alt={previewCreative.title || "Preview"}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t bg-background p-4">
            <Button variant="outline" onClick={() => setPreviewCreative(null)}>
              Fechar
            </Button>
            {previewCreative && (
              <Button asChild>
                <a
                  href={previewCreative.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Original
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteCreative}
        onOpenChange={(open) => !open && setDeleteCreative(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir criativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o
              criativo{" "}
              <span className="font-medium text-foreground">
                "{deleteCreative?.title}"
              </span>{" "}
              do servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Criativos;
