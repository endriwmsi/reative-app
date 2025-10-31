"use client";

import { Plus, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createCoupon } from "@/actions/coupon/coupon.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Switch } from "./ui/switch";

interface Product {
  id: number;
  name: string;
  basePrice: string;
  customPrice: string | null;
  category: string;
}

interface CreateCouponDialogProps {
  products: Product[];
  userId: string;
}

export default function CreateCouponDialog({
  products,
  userId,
}: CreateCouponDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    isUnique: true,
    maxUses: "",
    expiresAt: "",
    description: "",
  });

  const selectedProduct = products.find(
    (p) => p.id.toString() === formData.productId,
  );

  const calculateFinalPrice = () => {
    if (!selectedProduct || !formData.discountValue) return null;

    // Use o preço personalizado se existir, senão use o preço base
    const userPrice = selectedProduct.customPrice
      ? parseFloat(selectedProduct.customPrice)
      : parseFloat(selectedProduct.basePrice);
    const discount = parseFloat(formData.discountValue);

    if (formData.discountType === "percentage") {
      return userPrice * (1 - discount / 100);
    } else {
      return userPrice - discount;
    }
  };

  const finalPrice = calculateFinalPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.code || !formData.discountValue) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const result = await createCoupon({
        userId,
        productId: parseInt(formData.productId),
        code: formData.code,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        isUnique: formData.isUnique,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
        description: formData.description || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setFormData({
          productId: "",
          code: "",
          discountType: "percentage",
          discountValue: "",
          isUnique: true,
          maxUses: "",
          expiresAt: "",
          description: "",
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao criar cupom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Cupom
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Criar Cupom de Desconto
          </DialogTitle>
          <DialogDescription>
            Crie cupons personalizados para seus produtos. O desconto será
            aplicado no valor unitário (por cliente/item) de cada envio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Produto */}
          <div className="space-y-2">
            <Label htmlFor="product">Produto *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) =>
                setFormData({ ...formData, productId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} -{" "}
                    {formatCurrency(product.customPrice || product.basePrice)}
                    {product.customPrice && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (seu preço)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Código do Cupom */}
          <div className="space-y-2">
            <Label htmlFor="code">Código do Cupom *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="Ex: DESCONTO20, PROMO-JOAO"
              maxLength={20}
            />
          </div>

          {/* Tipo de Desconto */}
          <div className="space-y-2">
            <Label>Tipo de Desconto *</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value: "percentage" | "fixed") =>
                setFormData({ ...formData, discountType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor do Desconto */}
          <div className="space-y-2">
            <Label htmlFor="discountValue">
              Valor do Desconto *{" "}
              {formData.discountType === "percentage" ? "%" : "R$"}
            </Label>
            <Input
              id="discountValue"
              type="number"
              step="0.01"
              min="0"
              max={formData.discountType === "percentage" ? "100" : undefined}
              value={formData.discountValue}
              onChange={(e) =>
                setFormData({ ...formData, discountValue: e.target.value })
              }
              placeholder={
                formData.discountType === "percentage" ? "Ex: 20" : "Ex: 50.00"
              }
            />
          </div>

          {/* Preview do Preço Final */}
          {/* Preview do Preço Final */}
          {finalPrice !== null && selectedProduct && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex justify-between w-full">
                  <span>
                    {selectedProduct.customPrice
                      ? "Seu preço:"
                      : "Preço original:"}
                  </span>
                  <span>
                    {formatCurrency(
                      selectedProduct.customPrice || selectedProduct.basePrice,
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <div className="flex justify-between w-full">
                  <span>Desconto:</span>
                  <span>
                    -
                    {formatCurrency(
                      (
                        parseFloat(
                          selectedProduct.customPrice ||
                            selectedProduct.basePrice,
                        ) - finalPrice
                      ).toString(),
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <div className="flex justify-between w-full">
                  <span>Preço final por item:</span>
                  <span>{formatCurrency(finalPrice.toString())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Configurações de Uso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="isUnique">Uso único</Label>
              <Switch
                id="isUnique"
                checked={formData.isUnique}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, isUnique: checked })
                }
              />
            </div>

            {!formData.isUnique && (
              <div className="space-y-2">
                <Label htmlFor="maxUses">Máximo de usos (opcional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: e.target.value })
                  }
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data de expiração (opcional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ex: Promoção especial de fim de ano"
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar Cupom"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
