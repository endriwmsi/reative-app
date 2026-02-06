/** biome-ignore-all lint/suspicious/noArrayIndexKey: supress use of the index rule. */
"use client";

import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconChartBar,
  IconCoin,
  IconMessageCircle,
  IconRocket,
  IconTarget,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ============ COMPONENTES AUXILIARES ============

function AnimatedCounter({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOutQuart = 1 - (1 - progress) ** 4;
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

function InfiniteCarousel({
  items,
  speed = 30,
}: {
  items: string[];
  speed?: number;
}) {
  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 z-10 h-full w-24 bg-linear-to-r from-background to-transparent" />
      <div className="absolute right-0 top-0 z-10 h-full w-24 bg-linear-to-l from-background to-transparent" />
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: speed,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-lg font-medium text-muted-foreground/70"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function MarqueeStrip({
  children,
  reverse = false,
}: {
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="relative flex overflow-hidden bg-black py-3 border-y border-[#4D0DA2] shadow-[0_0_20px_#4D0DA2]">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{
          duration: 60,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

// ============ DADOS DA PÁGINA ============

const FEATURES = [
  {
    icon: IconTarget,
    title: "Criação e Otimização de Anúncios",
    description:
      "Anúncios estratégicos que convertem visitantes em clientes pagantes.",
  },
  {
    icon: IconTrendingUp,
    title: "Funil de Vendas Completo",
    description:
      "Estrutura do topo ao fundo do funil para maximizar suas conversões.",
  },
  {
    icon: IconRocket,
    title: "Estratégia Orgânica",
    description:
      "Potencialize suas vendas mesmo sem investir em anúncios pagos.",
  },
  {
    icon: IconMessageCircle,
    title: "Script de Vendas Personalizado",
    description: "Roteiros prontos para você converter mais no atendimento.",
  },
  {
    icon: IconBrandWhatsapp,
    title: "Grupo Exclusivo no WhatsApp",
    description: "Suporte direto e networking com outros empreendedores.",
  },
  {
    icon: IconChartBar,
    title: "Relatórios Detalhados",
    description: "Acompanhe cada centavo investido com transparência total.",
  },
];

const clientLogos = [
  {
    src: "/assets/images/logos/client-1.png",
    alt: "Cliente 1",
  },
  {
    src: "/assets/images/logos/client-2.png",
    alt: "Cliente 2",
  },
  {
    src: "/assets/images/logos/client-3.png",
    alt: "Cliente 3",
  },
  {
    src: "/assets/images/logos/client-4.png",
    alt: "Cliente 4",
  },
];

const RESULTS = [
  { number: 500, suffix: "+", label: "Campanhas Criadas" },
  { number: 2, suffix: "M+", label: "Em Vendas Geradas" },
  { number: 150, suffix: "+", label: "Clientes Satisfeitos" },
  { number: 300, suffix: "%", label: "Aumento Médio de ROI" },
];

const CAROUSEL_ITEMS = [
  "🚀 Mais vendas",
  "📈 ROI garantido",
  "💰 Lucro real",
  "🎯 Tráfego qualificado",
  "📊 Métricas claras",
  "🔥 Resultados rápidos",
  "💪 Crescimento escalável",
  "✨ Estratégia vencedora",
];

const MARQUEE_ITEMS = (
  <>
    {Array(10)
      .fill(null)
      .map((_, i) => (
        <span
          key={i}
          className="flex items-center gap-8 text-white font-semibold"
        >
          <span>TRANSFORME SEU NEGÓCIO</span>
          <span className="text-[#4D0DA2]">•</span>
          <span>ESCALE SUAS VENDAS</span>
          <span className="text-[#4D0DA2]">•</span>
          <span>CONQUISTE RESULTADOS</span>
          <span className="text-[#4D0DA2]">•</span>
        </span>
      ))}
  </>
);

const EXTERNAL_LINK = "https://www.gsrocket.com.br/forms-gt-ln/";

// ============ COMPONENTE PRINCIPAL ============

export default function GestaoDeTrafegoPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const handleScrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Background linears */}
        <div className="absolute inset-0 bg-linear-to-br from-chart-1/10 via-background to-chart-4/10" />
        <motion.div
          className="absolute -left-64 -top-64 h-125 w-125 rounded-full bg-chart-1/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 h-100 w-100 rounded-full bg-chart-4/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        />

        <motion.div style={{ y, opacity }} className="relative z-10">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Coluna da Esquerda - Conteúdo */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="space-y-8"
              >
                <motion.div variants={itemVariants}>
                  <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
                    🔥 Vagas Limitadas
                  </Badge>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
                >
                  Transforme cliques em{" "}
                  <span className="bg-linear-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                    clientes
                  </span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-lg text-muted-foreground md:text-xl"
                >
                  Multiplique seus resultados e aumente suas vendas com um
                  profissional especializado em anúncios online.
                </motion.p>

                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-4"
                >
                  <Button
                    size="lg"
                    asChild
                    className="gap-2 text-lg h-14 px-8 bg-green-500 hover:bg-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)] hover:scale-105 transition-all duration-300"
                  >
                    <a
                      href={EXTERNAL_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Quero Escalar Minhas Vendas
                      <IconArrowRight className="h-5 w-5" />
                    </a>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="gap-2 text-lg h-14 px-8 hover:scale-105 transition-all duration-300"
                  >
                    <Link
                      href="#saiba-mais"
                      onClick={(e) => handleScrollToSection(e, "saiba-mais")}
                      rel="noopener noreferrer"
                    >
                      Saiba mais
                      <IconArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-6 pt-4"
                >
                  <div className="flex -space-x-3">
                    {clientLogos.map((logo, idx) => (
                      <Avatar key={idx}>
                        <AvatarImage
                          src={logo.src}
                          alt={logo.alt}
                          width={40}
                          height={40}
                        />
                      </Avatar>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">+150</span>{" "}
                    empresas já escalaram suas vendas
                  </p>
                </motion.div>
              </motion.div>

              {/* Coluna da Direita - Imagem/Ilustração */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative mx-auto aspect-square max-w-lg">
                  {/* Card flutuante principal */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    <Image
                      src="/assets/images/lp/lp2.png"
                      alt="Gestão de Tráfego"
                      fill
                      className="object-contain"
                    />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -8, 0], x: [0, -5, 0] }}
                    transition={{
                      duration: 4.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 1,
                    }}
                    className="absolute right-4 top-5 rounded-2xl bg-card p-4 shadow-xl border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-chart-1/20 p-2">
                        <IconUsers className="h-5 w-5 text-chart-1" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Leads/mês
                        </p>
                        <p className="text-lg font-bold">+1.2K</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 8, 0], x: [0, 5, 0] }}
                    transition={{
                      duration: 4.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 1,
                    }}
                    className="absolute right-100 top-90 rounded-2xl bg-card p-4 shadow-xl border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-500/20 p-2">
                        <IconCoin className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Mais faturamento
                        </p>
                        <p className="text-lg font-bold">20%</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ MARQUEE STRIP ============ */}
      <MarqueeStrip>{MARQUEE_ITEMS}</MarqueeStrip>

      {/* ============ RESULTADOS ============ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {RESULTS.map((result, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="text-4xl font-bold text-chart-1 md:text-5xl">
                  <AnimatedCounter end={result.number} suffix={result.suffix} />
                </div>
                <p className="mt-2 text-muted-foreground">{result.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ CARROSSEL INFINITO ============ */}
      <section className="border-y bg-background py-8">
        <InfiniteCarousel items={CAROUSEL_ITEMS} />
      </section>

      {/* ============ SOBRE / O QUE ESTÁ INCLUSO ============ */}
      <section id="sobre" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-4">
                O que você recebe
              </Badge>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold md:text-4xl lg:text-5xl"
            >
              Tudo que você precisa para{" "}
              <span className="bg-linear-to-r from-chart-1 to-[#4D0DA2] bg-clip-text text-transparent">
                escalar suas vendas
              </span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mt-4 text-lg text-muted-foreground"
            >
              Uma solução completa de gestão de tráfego que cuida de tudo para
              você focar no que realmente importa: seu negócio.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-chart-1/50 group">
                  <CardHeader>
                    <div className="mb-2 inline-flex rounded-xl bg-chart-1/10 p-3 w-fit group-hover:bg-chart-1/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-chart-1" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="container relative mx-auto px-4" id="saiba-mais">
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 mt-10 justify-center"
            >
              <motion.h2
                variants={itemVariants}
                className="text-3xl font-bold md:text-4xl lg:text-5xl"
              >
                Pronto para escalar seu negócio?
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="mt-4 text-lg text-white/80"
              >
                Não perca mais tempo. Fale com um especialista agora e comece a
                transformar cliques em clientes pagantes.
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="mx-auto max-w-3xl text-center text-white mt-10"
          >
            <Button
              size="lg"
              asChild
              className="gap-2 text-lg h-14 px-8 bg-green-500 hover:bg-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.7)] hover:scale-105 transition-all duration-300"
            >
              <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer">
                Quero Escalar Minhas Vendas
                <IconArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Hub LN. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <a
                href="/termos-e-condicoes"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Termos e Condições
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
