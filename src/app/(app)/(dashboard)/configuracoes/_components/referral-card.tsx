"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReferralCardProps = {
  referralCode: string;
};

export function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast.error("Erro ao copiar o link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Junte-se à nossa plataforma",
          text: "Use meu link de indicação para se registrar!",
          url: referralUrl,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
        if ((error as Error).name !== "AbortError") {
          toast.error("Erro ao compartilhar o link");
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Link de Indicação</h3>
        <p className="text-sm text-muted-foreground">
          Compartilhe seu link de indicação com outras pessoas. Seu código é:{" "}
          <span className="font-mono font-bold">{referralCode}</span>
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={referralUrl}
            readOnly
            className="pr-10 font-mono text-sm"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="Copiar link"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleShare}
          title="Compartilhar link"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border border-muted bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Dica:</strong> Compartilhe este link com amigos e colegas.
          Quando eles se cadastrarem usando seu link, você será creditado como o
          indicador.
        </p>
      </div>
    </div>
  );
}
