import { IconAward, IconMedal, IconTrophy } from "@tabler/icons-react";
import {
  getTopPartners,
  type TopPartner,
} from "@/actions/dashboard/top-partners.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TopPartnersPodium = async () => {
  let topPartners: TopPartner[] = [];

  try {
    const partners = await getTopPartners(3);
    topPartners = partners;
  } catch (error) {
    console.error("Erro ao carregar top parceiros:", error);
  }

  // Se não houver parceiros suficientes, mostrar mensagem
  if (topPartners.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconTrophy className="size-5 text-yellow-500" />
            Top Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <IconTrophy className="size-12 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground font-medium">
                Nenhum ranking disponível
              </p>
              <p className="text-sm text-muted-foreground/70">
                Aguardando envios pagos...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preencher com dados vazios se não houver 3 parceiros
  while (topPartners.length < 3) {
    topPartners.push({
      id: `empty-${topPartners.length}`,
      name: "Posição vazia",
      avatar: null,
      totalClients: 0,
      totalCommission: 0,
      totalSales: 0,
      growth: 0,
    });
  }

  const positions = [
    {
      index: 1,
      partner: topPartners[1],
      icon: IconMedal,
      bgColor: "bg-gradient-to-t from-slate-400 to-slate-300",
      iconColor: "text-slate-700",
      textColor: "text-slate-700",
      height: "h-16",
      avatarSize: "size-12",
      order: 1,
    },
    {
      index: 0,
      partner: topPartners[0],
      icon: IconTrophy,
      bgColor: "bg-gradient-to-t from-yellow-500 to-yellow-400",
      iconColor: "text-yellow-800",
      textColor: "text-yellow-800",
      height: "h-20",
      avatarSize: "size-16",
      order: 2,
    },
    {
      index: 2,
      partner: topPartners[2],
      icon: IconAward,
      bgColor: "bg-gradient-to-t from-amber-700 to-amber-600",
      iconColor: "text-amber-100",
      textColor: "text-amber-100",
      height: "h-12",
      avatarSize: "size-10",
      order: 3,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconTrophy className="size-5 text-yellow-500" />
          Top Usuários
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ranking de clientes enviados por parceiros
        </p>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex items-end justify-center gap-4 min-h-[200px]">
          {positions
            .sort((a, b) => a.order - b.order)
            .map((position) => {
              const Icon = position.icon;
              const isEmpty = position.partner.totalClients === 0;

              return (
                <div
                  key={position.index}
                  className="flex flex-col items-center group"
                >
                  {/* Avatar */}
                  <div className="mb-3 relative">
                    <Avatar
                      className={`${position.avatarSize} ring-2 ring-white shadow-lg transition-transform group-hover:scale-105`}
                    >
                      <AvatarImage
                        src={position.partner.avatar || "/placeholder.svg"}
                        alt={position.partner.name}
                        className="object-cover"
                      />
                      <AvatarFallback
                        className={`${
                          position.index === 0 ? "text-sm font-bold" : "text-xs"
                        } bg-gradient-to-br from-blue-100 to-purple-100 text-slate-700`}
                      >
                        {isEmpty
                          ? "?"
                          : position.partner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!isEmpty && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-white shadow-md"
                      >
                        {position.index + 1}
                      </Badge>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="text-center mb-3 space-y-1 min-w-0 max-w-[80px]">
                    <p
                      className={`font-semibold truncate ${
                        position.index === 0 ? "text-sm" : "text-xs"
                      }`}
                      title={position.partner.name}
                    >
                      {isEmpty ? "Vazio" : position.partner.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isEmpty ? "0" : position.partner.totalClients} cliente
                      {position.partner.totalClients !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Podium */}
                  <div
                    className={`
                    ${position.bgColor} 
                    ${position.height} 
                    w-16 rounded-t-lg shadow-lg
                    flex items-center justify-center
                    transition-all duration-200
                    group-hover:shadow-xl
                    ${isEmpty ? "opacity-40" : ""}
                  `}
                  >
                    <div className="text-center">
                      <Icon
                        className={`size-4 ${position.iconColor} mx-auto mb-1`}
                      />
                      <span
                        className={`text-xs font-bold ${position.textColor}`}
                      >
                        {position.index + 1}°
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPartnersPodium;
