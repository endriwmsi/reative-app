"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DownloadSolicitationsButtonProps {
  selectedIds: string[];
  onSuccess?: () => void;
}

export function DownloadSolicitationsButton({
  selectedIds,
  onSuccess,
}: DownloadSolicitationsButtonProps) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      toast.info("Iniciando download...");

      const response = await fetch("/api/download/capital-giro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao fazer download");
      }

      // Verificar se há dados para download
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) === 0) {
        toast.error("Nenhum dado encontrado para download");
        return;
      }

      // Criar blob do arquivo
      const blob = await response.blob();

      // Obter nome do arquivo do header
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "solicitacoes-capital-giro.xlsx";

      if (contentDisposition) {
        const matches = /filename="([^"]*)"/.exec(contentDisposition);
        if (matches?.[1]) {
          filename = matches[1];
        }
      }

      // Criar link temporário e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Download concluído com sucesso!");
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer download",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || selectedIds.length === 0}
      variant="outline"
      className="gap-2 w-full lg:w-auto"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "Baixando..." : `Baixar (${selectedIds.length})`}
    </Button>
  );
}
