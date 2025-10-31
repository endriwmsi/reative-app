"use client";

import { Eye, EyeOff, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toggleCouponStatus } from "@/actions/coupon/coupon.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  finalPrice: string;
  isUnique: boolean;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  expiresAt: Date | null;
  description: string | null;
  createdAt: Date;
  productId: number;
  productName: string;
  productBasePrice: string;
  productCategory: string;
}

interface CouponsTableProps {
  coupons: Coupon[];
}

export default function CouponsTable({ coupons }: CouponsTableProps) {
  const [loadingToggle, setLoadingToggle] = useState<string | null>(null);

  const handleToggleStatus = async (
    couponId: string,
    currentStatus: boolean,
  ) => {
    setLoadingToggle(couponId);
    try {
      const result = await toggleCouponStatus(couponId, !currentStatus);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao alterar status do cupom");
    } finally {
      setLoadingToggle(null);
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return <Badge variant="secondary">Inativo</Badge>;
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }

    return <Badge variant="default">Ativo</Badge>;
  };

  const getUsageText = (coupon: Coupon) => {
    if (coupon.isUnique) {
      return coupon.currentUses > 0 ? "Usado" : "Não usado";
    }

    if (coupon.maxUses) {
      return `${coupon.currentUses}/${coupon.maxUses}`;
    }

    return `${coupon.currentUses} usos`;
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case "limpa_nome":
        return "Limpa Nome";
      case "recuperacao_credito":
        return "Recuperação de Crédito";
      case "consultoria":
        return "Consultoria";
      default:
        return category;
    }
  };

  if (coupons.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cupom criado</h3>
          <p className="text-muted-foreground text-center">
            Você ainda não criou nenhum cupom de desconto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Meus Cupons ({coupons.length})
        </CardTitle>
        <CardDescription>
          Gerencie seus cupons de desconto criados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Preço Final</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                        {coupon.code}
                      </code>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{coupon.productName}</p>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(coupon.productCategory)}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : formatCurrency(coupon.discountValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Base: {formatCurrency(coupon.productBasePrice)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(coupon.finalPrice)}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{getUsageText(coupon)}</p>
                      {coupon.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          Exp: {new Date(coupon.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{getStatusBadge(coupon)}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleStatus(coupon.id, coupon.isActive)
                        }
                        disabled={loadingToggle === coupon.id}
                      >
                        {loadingToggle === coupon.id ? (
                          "..."
                        ) : coupon.isActive ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
