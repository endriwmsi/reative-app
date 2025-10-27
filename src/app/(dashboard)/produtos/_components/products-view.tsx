"use client";

import { Check, Pencil, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { setMyResalePrice } from "@/actions/product/product.action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  customPrice: string | null;
  resalePrice?: string | null; // Preço de revenda definido pelo usuário
}

interface ProductsViewProps {
  products: Product[];
  userId: string;
}

export default function ProductsView({ products, userId }: ProductsViewProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [loading, setLoading] = useState<number | null>(null);

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    // Se já tem preço de revenda, usar ele, senão sugerir 20% acima do preço base
    const currentCustomPrice = product.customPrice || product.basePrice;
    const suggestedPrice = (parseFloat(currentCustomPrice) * 1.2).toFixed(2);
    setEditPrice(product.resalePrice || suggestedPrice);
  };

  const handleSavePrice = async (productId: number) => {
    if (!editPrice || parseFloat(editPrice) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    setLoading(productId);
    try {
      const result = await setMyResalePrice(userId, productId, editPrice);

      if (result.success) {
        toast.success(result.message);
        setEditingId(null);
        setEditPrice("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao salvar preço de revenda");
    } finally {
      setLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };
  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case "limpa_nome":
        return "Limpa Nome";
      case "recuperacao_credito":
        return "Recuperação de Crédito";
      default:
        return category;
    }
  };

  const getCategoryBadgeVariant = (
    category: string,
  ): "default" | "secondary" | "outline" => {
    switch (category.toLowerCase()) {
      case "limpa_nome":
        return "default";
      case "recuperacao_credito":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum produto disponível
          </h3>
          <p className="text-muted-foreground text-center">
            Não há produtos disponíveis no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const currentPrice = product.customPrice || product.basePrice;
        const resalePrice = product.resalePrice;
        const hasDiscount =
          product.customPrice &&
          parseFloat(product.customPrice) < parseFloat(product.basePrice);
        const isEditing = editingId === product.id;
        const isLoading = loading === product.id;

        return (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant={getCategoryBadgeVariant(product.category)}>
                    {getCategoryLabel(product.category)}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm">
                {product.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Preço do Indicador */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Preço do seu indicador
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.basePrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preço de Revenda */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Seu preço de revenda
                  </Label>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 250.00"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="text-lg font-semibold"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSavePrice(product.id)}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            "Salvando..."
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        {resalePrice
                          ? formatCurrency(resalePrice)
                          : "Não definido"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(product)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {resalePrice ? "Editar" : "Definir"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Margem de Lucro */}
                {resalePrice && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Sua margem de lucro
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        {formatCurrency(
                          (
                            parseFloat(resalePrice) - parseFloat(currentPrice)
                          ).toString(),
                        )}{" "}
                        por unidade
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button className="w-full" variant="default">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Solicitar Serviço
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
