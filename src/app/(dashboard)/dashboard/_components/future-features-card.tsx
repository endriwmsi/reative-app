import { IconStars } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FutureFeaturesCard = () => {
  return (
    <Card className="h-max">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconStars className="size-5 text-blue-500" />
          Novidades em Breve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg font-medium">
              🚀 Funcionalidade em Desenvolvimento
            </p>
            <p className="text-sm text-muted-foreground">
              Estamos preparando algo incrível para você!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FutureFeaturesCard;
