import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Hub LN - Configurações",
  description: "Gerencie seus envios de forma fácil e rápida.",
};

export default function SettingsPage() {
  redirect("/configuracoes/perfil");
}
