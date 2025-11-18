"use client";

import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Share2,
  Eye,
  Search,
  TreePine,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getAllReferralTrees,
  getReferralStats,
  getUserReferralTree,
  type ReferralNode,
} from "@/actions/user/referral-tree.action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export default function ReferralTreePage() {
  const { data: session } = authClient.useSession();
  const [referralNodes, setReferralNodes] = useState<ReferralNode[]>([]);
  const [stats, setStats] = useState<{
    directReferrals: number;
    referralCode: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;

      setLoading(true);
      setError(null);

      try {
        // Busca a árvore de indicações
        const treeResponse = isAdmin
          ? await getAllReferralTrees()
          : await getUserReferralTree();

        if (!treeResponse.success) {
          setError(
            treeResponse.error || "Erro ao carregar árvore de indicações",
          );
          return;
        }

        setReferralNodes(treeResponse.data || []);

        // Busca estatísticas apenas se não for admin
        if (!isAdmin) {
          const statsResponse = await getReferralStats();
          if (statsResponse.success && statsResponse.data) {
            setStats(statsResponse.data);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Erro interno. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user, isAdmin]);

  // Função para contar total de nós recursivamente
  const countNodes = useCallback((nodes: ReferralNode[]): number => {
    return nodes.reduce((total, node) => {
      return total + 1 + countNodes(node.children);
    }, 0);
  }, []);

  // Função para filtrar nós por termo de busca
  const filterNodes = useCallback(
    (nodes: ReferralNode[], term: string): ReferralNode[] => {
      if (!term) return nodes;

      return nodes
        .filter((node) => {
          const matchesSearch =
            node.name.toLowerCase().includes(term.toLowerCase()) ||
            node.email.toLowerCase().includes(term.toLowerCase()) ||
            node.referralCode.toLowerCase().includes(term.toLowerCase());

          const hasMatchingChildren =
            filterNodes(node.children, term).length > 0;

          return matchesSearch || hasMatchingChildren;
        })
        .map((node) => ({
          ...node,
          children: filterNodes(node.children, term),
        }));
    },
    [],
  );

  // Nós filtrados
  const filteredNodes = useMemo(() => {
    return filterNodes(referralNodes, searchTerm);
  }, [referralNodes, searchTerm, filterNodes]);

  // Estatísticas
  const totalUsers = useMemo(
    () => countNodes(referralNodes),
    [referralNodes, countNodes],
  );
  const filteredUsers = useMemo(
    () => countNodes(filteredNodes),
    [filteredNodes, countNodes],
  );

  // Funções de controle
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allNodeIds = new Set<string>();
    const collectIds = (nodes: ReferralNode[]) => {
      nodes.forEach((node) => {
        allNodeIds.add(node.id);
        collectIds(node.children);
      });
    };
    collectIds(referralNodes);
    setExpandedNodes(allNodeIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Funções para copiar
  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${stats?.referralCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(stats?.referralCode || "");
      setCopiedCode(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast.error("Erro ao copiar o código");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      toast.success("Link de indicação copiado!");
      setTimeout(() => setCopiedLink(false), 2000);
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
      handleCopyLink();
    }
  };

  const renderNode = (node: ReferralNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const shouldShowChildren = showAllLevels || isExpanded;

    return (
      <div key={node.id} className="mb-2">
        <Collapsible open={shouldShowChildren}>
          <div
            className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
            style={{ marginLeft: `${Math.min(depth * 16, 64)}px` }}
          >
            <div className="flex-shrink-0">
              {hasChildren ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleNode(node.id)}
                  >
                    {shouldShowChildren ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              ) : (
                <div className="h-6 w-6 flex items-center justify-center">
                  <UserCheck className="w-3 h-3 text-green-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {node.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {node.referralCode}
                </Badge>
                {hasChildren && (
                  <Badge variant="outline" className="text-xs">
                    {node.children.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{node.email}</span>
                <span>•</span>
                <span>
                  {new Date(node.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          <CollapsibleContent>
            {hasChildren && (
              <div className="mt-1">
                {node.children.map((child) => renderNode(child, depth + 1))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <TreePine className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Árvore de Indicações</h1>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TreePine className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Árvore de Indicações</h1>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <TreePine className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">
            {isAdmin
              ? "Todas as Árvores de Indicações"
              : "Minha Árvore de Indicações"}
          </h1>
        </div>

        {/* Estatísticas - apenas para usuários não-admin */}
        {stats && !isAdmin && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Seu Código
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.referralCode}</div>
                    <p className="text-xs text-muted-foreground">
                      Código de referência
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="ml-2"
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Indicações Diretas
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.directReferrals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pessoas que você indicou
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Nível da Rede
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.directReferrals > 0 ? "Ativo" : "Iniciante"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Status da sua rede
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Compartilhar
                </CardTitle>
                <TreePine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Link de Indicação:</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {referralUrl}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="flex-1"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Árvore de Indicações */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  {isAdmin ? "Todas as Árvores" : "Sua Árvore de Indicações"}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {searchTerm ? filteredUsers : totalUsers} usuários
                  </span>
                  {searchTerm && <span>({filteredUsers} filtrados)</span>}
                </div>
              </div>

              {/* Controles */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Botões de controle */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllLevels(!showAllLevels)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {showAllLevels ? "Compacto" : "Expandir Tudo"}
                  </Button>

                  {!showAllLevels && (
                    <>
                      <Button variant="outline" size="sm" onClick={expandAll}>
                        Expandir
                      </Button>
                      <Button variant="outline" size="sm" onClick={collapseAll}>
                        Recolher
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredNodes.length > 0 ? (
                filteredNodes.map((node) => renderNode(node))
              ) : searchTerm ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Search className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm font-medium">
                    Nenhum resultado encontrado
                  </p>
                  <p className="text-xs text-center">
                    Tente buscar por um nome, email ou código diferente
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <TreePine className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    Nenhuma indicação encontrada
                  </p>
                  <p className="text-sm text-center">
                    {isAdmin
                      ? "Não há árvores de indicações no sistema"
                      : "Você ainda não fez nenhuma indicação. Compartilhe seu código de referência!"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações sobre como funciona - apenas para usuários não-admin */}
        {!isAdmin && stats && (
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Seu código de indicação:</strong> {stats.referralCode}
                </p>
                <p>
                  Compartilhe seu código com outras pessoas. Quando elas se
                  registrarem usando seu código, aparecerão na sua árvore de
                  indicações.
                </p>
                <p>
                  Cada pessoa que você indicar também pode indicar outras
                  pessoas, criando uma rede em árvore que se expande
                  infinitamente.
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">Dica:</p>
                  <p>
                    Incentive suas indicações a também compartilharem seus
                    códigos. Quanto maior sua rede, maiores são as
                    possibilidades de crescimento!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
