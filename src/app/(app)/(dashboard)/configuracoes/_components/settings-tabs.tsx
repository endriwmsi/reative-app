"use client";

import { Building2, FileText, MapPin, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AddressFormData,
  DocumentFormData,
  ProfileFormData,
} from "../_schemas/profile-schema";
import { AddressForm } from "./address-form";
import { DocumentsForm } from "./documents-form";
import { ProfileForm } from "./profile-form";

type SettingsTabsProps = {
  profileData: ProfileFormData;
  addressData: AddressFormData;
  documentsData: DocumentFormData;
};

export function SettingsTabs({
  profileData,
  addressData,
  documentsData,
}: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="mt-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="address" className="gap-2">
          <MapPin className="h-4 w-4" />
          Endereço
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-2">
          <FileText className="h-4 w-4" />
          Documentos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais e de contato
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <ProfileForm defaultValues={profileData} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="address" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
            <CardDescription>
              Mantenha seu endereço atualizado para entregas e correspondências
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <AddressForm defaultValues={addressData} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Documentos
            </CardTitle>
            <CardDescription>
              Gerencie seus documentos de identificação (CPF ou CNPJ)
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <DocumentsForm defaultValues={documentsData} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
