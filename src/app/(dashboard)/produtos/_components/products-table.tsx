"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { setUserProductPrice } from "@/actions/product/product.action";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  category: string;
  customPrice: string | null;
}

interface ProductsTableProps {
  products: Product[];
  userId: string;
}

export default function ProductsTable({
  products,
  userId,
}: ProductsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [loading, setLoading] = useState<number | null>(null);

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditPrice(product.customPrice || product.basePrice);
  };

  const handleSavePrice = async (productId: number) => {
    if (!editPrice || parseFloat(editPrice) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    setLoading(productId);
    try {
      const result = await setUserProductPrice(userId, productId, editPrice);

      if (result.success) {
        toast.success(result.message);
        setEditingId(null);
        setEditPrice("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao salvar preço");
    } finally {
      setLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const getCategoryBadgeVariant = (category: string) => {
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
        <CardHeader>
          <CardTitle>Nenhum produto encontrado</CardTitle>
          <CardDescription>
            Não há produtos disponíveis no momento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Disponíveis</CardTitle>
        <CardDescription>
          Defina preços personalizados para os produtos que você oferece aos
          seus indicados. Você pode ajustar os preços com base na sua margem de
          comissão desejada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço Base</TableHead>
                <TableHead className="text-right">Seu Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(product.category)}>
                      {product.category === "limpa_nome"
                        ? "Limpa Nome"
                        : product.category === "recuperacao_credito"
                          ? "Recuperação de Crédito"
                          : product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(product.basePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === product.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Label
                          htmlFor={`price-${product.id}`}
                          className="sr-only"
                        >
                          Preço personalizado
                        </Label>
                        <Input
                          id={`price-${product.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 text-right"
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <div className="font-mono">
                        {product.customPrice
                          ? formatCurrency(product.customPrice)
                          : formatCurrency(product.basePrice)}
                        {product.customPrice && (
                          <div className="text-xs text-muted-foreground">
                            (personalizado)
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === product.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSavePrice(product.id)}
                          disabled={loading === product.id}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={loading === product.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(product)}
                        disabled={loading !== null}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar preço</span>
                      </Button>
                    )}
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
