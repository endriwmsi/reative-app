"use client";

import { AlertTriangle, Calendar, Check, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ChangelogModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenChangelog = localStorage.getItem("changelog-2025-11-27");
    if (!hasSeenChangelog) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("changelog-2025-11-27", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Novidades da Plataforma
          </DialogTitle>
          <DialogDescription>
            Fique por dentro das últimas atualizações e melhorias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mensalidade Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  Aviso Importante
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  A partir do dia <strong>01/12/2025</strong>, será implementada
                  uma mensalidade no valor de <strong>R$ 50,00</strong> para
                  manutenção e melhorias contínuas da plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* New Features */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Novas Funcionalidades (Até o fim de dezembro de 2025)
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>Consulta de CPF e CNPJ</li>
              <li>Consulta Serasa, SPC & Boa Vista</li>
            </ul>
          </div>

          {/* Future Features */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Em Breve
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
              <li>CRM integrado para WhatsApp</li>
              <li>Painel de criativos de alta conversão (Limpa Nome)</li>
              <li>Melhorias significativas de performance</li>
              <li>Otimização da experiência do usuário</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Entendi e fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
