import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Hub LN - Termos & Condições",
  description:
    "Página de Termos e Condições - Leia atentamente os termos e condições de uso da plataforma Hub LN.",
};

const TERMS_SECTIONS = [
  {
    id: "01",
    title: "1. Aceitação dos Termos",
    content:
      "Ao acessar e utilizar esta plataforma, você concorda em cumprir e ficar vinculado aos seguintes Termos e Condições de Uso. Se você não concordar com qualquer parte destes termos, você não deve utilizar nossos serviços. Estes termos aplicam-se a todos os visitantes, usuários e outras pessoas que acessam ou usam o serviço.",
  },
  {
    id: "02",
    title: "2. Uso do Serviço",
    content:
      "Você concorda em usar o serviço apenas para fins legais e de acordo com estes Termos. Você é responsável por garantir que o uso do serviço não viole nenhuma lei, regulamento ou direito de terceiros. É estritamente proibido: - Utilizar o serviço para qualquer finalidade fraudulenta ou ilegal. - Interferir ou interromper a integridade ou o desempenho do serviço. - Tentar obter acesso não autorizado a qualquer parte do serviço ou seus sistemas relacionados.",
  },
  {
    id: "03",
    title: "3. Cadastro e Segurança da Conta",
    content:
      "Para acessar determinados recursos do serviço, você pode ser obrigado a criar uma conta. Você concorda em fornecer informações precisas, completas e atualizadas durante o processo de registro. Você é o único responsável por manter a confidencialidade de sua senha e conta, e por todas as atividades que ocorram sob sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta.",
  },
  {
    id: "04",
    title: "4. Propriedade Intelectual",
    content:
      "O serviço e seu conteúdo original (excluindo conteúdo fornecido pelos usuários), recursos e funcionalidades são e permanecerão de propriedade exclusiva da plataforma e de seus licenciadores. O serviço é protegido por direitos autorais, marcas registradas e outras leis de propriedade intelectual.",
  },
  {
    id: "05",
    title: "5. Privacidade",
    content:
      "Sua privacidade é importante para nós. Nossa Política de Privacidade explica como coletamos, usamos e divulgamos informações sobre você. Ao usar o serviço, você concorda que podemos usar suas informações de acordo com nossa Política de Privacidade.",
  },
  {
    id: "06",
    title: "6. Limitação de Responsabilidade",
    content:
      "Em nenhuma circunstância a plataforma, seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes do seu acesso ou uso ou incapacidade de acessar ou usar o serviço.",
  },
  {
    id: "07",
    title: "7. Alterações nos Termos",
    content:
      "Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedênciaantes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério.",
  },
  {
    id: "08",
    title: "8. Contato",
    content:
      "Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco através dos canais de suporte disponíveis na plataforma.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-4 border-b mb-6">
            <CardTitle className="text-3xl font-bold text-center">
              Termos e Condições de Uso HUB-LN.
            </CardTitle>
            <p className="text-center text-muted-foreground text-sm mt-2">
              Última atualização: 02 de Dezembro de 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-8 text-justify leading-relaxed text-foreground/90">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.id} className="space-y-4">
                <h2 className="text-xl font-semibold mb-3 text-foreground">
                  {section.title}
                </h2>
                <p>{section.content}</p>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
