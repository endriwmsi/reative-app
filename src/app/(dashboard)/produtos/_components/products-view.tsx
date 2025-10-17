"use client";

import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  customPrice: string | null;
}

interface ProductsViewProps {
  products: Product[];
}

export default function ProductsView({ products }: ProductsViewProps) {
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
        const hasDiscount =
          product.customPrice &&
          parseFloat(product.customPrice) < parseFloat(product.basePrice);

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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.basePrice)}
                      </span>
                    )}
                  </div>

                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        Preço especial
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Economia de{" "}
                        {formatCurrency(
                          (
                            parseFloat(product.basePrice) -
                            parseFloat(currentPrice)
                          ).toString(),
                        )}
                      </span>
                    </div>
                  )}
                </div>
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
