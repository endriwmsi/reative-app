"use client";

import {
  IconBrandWhatsapp,
  // IconChartBar,
  IconPhoto,
  // IconRobot,
} from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const features = [
  {
    id: 1,
    title: "CRM para WhatsApp",
    description: "Gerencie seus leads diretamente no WhatsApp",
    icon: IconBrandWhatsapp,
    image: "/assets/images/whatscrm-hubln.jpg",
    videoUrl:
      "https://www.reativemais.com.br/wp-content/uploads/2025/11/crm.mp4",
    color: "bg-green-500/10",
    borderColor: "border-green-500/20",
    iconColor: "text-green-500",
  },
  {
    id: 2,
    title: "Criativos para Anúncios",
    description: "Biblioteca de criativos de alta conversão",
    icon: IconPhoto,
    image: "/assets/images/criative-pack-hubln.jpg",
    videoUrl:
      "https://www.reativemais.com.br/wp-content/uploads/2025/11/Pack-posts.mp4",
    color: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-500",
  },
  // {
  //   id: 3,
  //   title: "Automação de Vendas",
  //   description: "Automatize seu processo comercial",
  //   icon: IconRobot,
  //   image: "/assets/images/automation-bg.jpg", // Placeholder
  //   videoUrl: "",
  //   color: "bg-blue-500/10",
  //   borderColor: "border-blue-500/20",
  //   iconColor: "text-blue-500",
  // },
  // {
  //   id: 4,
  //   title: "Analytics Avançado",
  //   description: "Métricas detalhadas do seu negócio",
  //   icon: IconChartBar,
  //   image: "/assets/images/analytics-bg.jpg", // Placeholder
  //   videoUrl: "",
  //   color: "bg-orange-500/10",
  //   borderColor: "border-orange-500/20",
  //   iconColor: "text-orange-500",
  // },
];

export default function UpcomingFeatures() {
  const [selectedFeature, setSelectedFeature] = useState<
    (typeof features)[0] | null
  >(null);

  return (
    <>
      <div className="w-full">
        <div className="overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
          <div className="flex gap-4 px-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:px-6">
            {features.map((feature) => (
              <button
                type="button"
                key={feature.id}
                onClick={() => setSelectedFeature(feature)}
                className={cn(
                  "min-w-[280px] flex-shrink-0 lg:min-w-0 lg:flex-shrink text-left",
                  "group relative h-48 overflow-hidden rounded-xl border bg-background transition-all duration-300 hover:shadow-lg",
                  "opacity-60 hover:opacity-100 cursor-pointer",
                  feature.borderColor,
                )}
              >
                {/* Badge Novidade */}
                <div className="absolute top-3 right-3 z-20 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm backdrop-blur-sm">
                  Novidade em breve
                </div>

                {/* Background Image/Video Container */}
                <div className="absolute inset-0 bg-muted">
                  {/* Replace this div with <img src={feature.image} /> or <video /> */}
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={1920}
                    height={1080}
                  />
                  <div
                    className={cn("h-full w-full opacity-20", feature.color)}
                  />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "rounded-lg p-1.5 bg-white/10 backdrop-blur-sm",
                        )}
                      >
                        <feature.icon className="size-5 text-white" />
                      </div>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        Em breve
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold tracking-tight text-white">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {/* Elemento invisível para criar espaço à direita em mobile */}
            <div className="w-2 flex-shrink-0 lg:hidden" aria-hidden="true" />
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedFeature}
        onOpenChange={(open) => !open && setSelectedFeature(null)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedFeature?.title}</DialogTitle>
            <DialogDescription>
              {selectedFeature?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {selectedFeature?.videoUrl ? (
              <iframe
                width="100%"
                height="100%"
                src={selectedFeature.videoUrl}
                title={selectedFeature.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Vídeo demonstrativo em breve
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
