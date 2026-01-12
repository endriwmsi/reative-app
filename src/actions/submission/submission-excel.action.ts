"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { auth } from "@/auth";

export interface ClientData {
  name: string;
  document: string;
}

export async function processExcelFile(
  file: File,
): Promise<{ success: boolean; data?: ClientData[]; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/login");

      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    // Validar tamanho do arquivo (10MB máximo)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "Arquivo muito grande. Máximo permitido: 10MB",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as unknown[][];

    if (jsonData.length < 2) {
      return {
        success: false,
        error:
          "Arquivo deve conter pelo menos um cabeçalho e uma linha de dados",
      };
    }

    const sheetHeaders = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    // Mapear colunas (flexível para diferentes formatos)
    const getColumnIndex = (possibleNames: string[]) => {
      return sheetHeaders.findIndex((header) => {
        if (!header) return false;
        const headerStr = header.toString().toLowerCase().trim();
        return possibleNames.some((name) => {
          const nameStr = name.toLowerCase().trim();
          // Busca exata primeiro, depois busca por inclusão
          return headerStr === nameStr || headerStr.includes(nameStr);
        });
      });
    };

    const nameIndex = getColumnIndex(["nome", "name", "cliente"]);
    const documentoIndex = getColumnIndex(["documento", "cpf", "cnpj"]);

    if (nameIndex === -1) {
      return { success: false, error: "Coluna 'nome' é obrigatória" };
    }

    const clients: ClientData[] = [];

    for (const row of dataRows) {
      const name = row[nameIndex]?.toString().trim();
      if (!name) continue;

      const document = row[documentoIndex]?.toString().trim() || "";
      if (!document) continue;

      const client: ClientData = {
        name: sanitizeName(name),
        document: sanitizeDocument(document),
      };

      // Validar dados mais rigorosamente
      const cleanDocument = client.document.replace(/\D/g, "");
      const isValidClient =
        client.name.length >= 2 &&
        (cleanDocument.length === 11 || cleanDocument.length === 14);

      if (isValidClient) {
        clients.push(client);
      }
    }

    if (clients.length === 0) {
      return {
        success: false,
        error:
          "Nenhum cliente válido encontrado no arquivo. Verifique se o arquivo contém nomes com pelo menos 2 caracteres e documentos (CPF/CNPJ) válidos.",
      };
    }

    return { success: true, data: clients };
  } catch (error) {
    console.error("Erro ao processar arquivo Excel:", error);
    return { success: false, error: "Erro ao processar arquivo Excel" };
  }
}

function sanitizeName(name: string): string {
  return name.trim().slice(0, 255).replace(/[<>]/g, "");
}

function sanitizeDocument(document: string): string {
  return document.replace(/[^\d.-]/g, "").slice(0, 18);
}
