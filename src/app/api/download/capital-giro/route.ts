import { inArray } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { markCapitalGiroAsDownloaded } from "@/actions/capital-giro/capital-giro.action";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { capitalGiro } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    // Verificar se o usuário é admin
    const isAdmin =
      Boolean((session.user as Record<string, unknown>).isAdmin) || false;

    if (!isAdmin) {
      return new NextResponse("Permissão negada", { status: 403 });
    }

    // Obter os IDs dos envios selecionados do body da requisição
    const body = await request.json();
    const ids: string[] = body.ids || [];

    if (ids.length === 0) {
      return new NextResponse("Nenhuma solicitação selecionada", {
        status: 400,
      });
    }

    // Buscar os dados
    const solicitations = await db
      .select()
      .from(capitalGiro)
      .where(inArray(capitalGiro.id, ids));

    if (solicitations.length === 0) {
      return new NextResponse("Nenhuma solicitação encontrada", {
        status: 404,
      });
    }

    // Preparar dados para o Excel
    const sheetData = solicitations.map((item) => ({
      ID: item.id,
      Nome: item.name,
      Email: item.email,
      Telefone: item.phone,
      CPF: item.cpf,
      "Estado Civil": item.estadoCivil,
      "Endereço Pessoa": item.enderecoPessoa,
      "Cidade Pessoa": item.cidadePessoa,
      "Estado Pessoa": item.estadoPessoa,
      "Razão Social": item.razaoSocial,
      CNPJ: item.cnpj,
      Faturamento: item.faturamento,
      "Endereço Empresa": item.enderecoEmpresa,
      "Cidade Empresa": item.cidadeEmpresa,
      "Estado Empresa": item.estadoEmpresa,
      "Tem Restrição": item.temRestricao === "sim" ? "Sim" : "Não",
      "Valor Restrição": item.valorRestricao || "",
      Status: item.status,
      "Data Criação": item.createdAt.toLocaleString("pt-BR"),
    }));

    // Criar worksheet
    const worksheet = XLSX.utils.json_to_sheet(sheetData);

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitações");

    // Gerar buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Marcar como baixado
    await markCapitalGiroAsDownloaded(ids);

    // Retornar arquivo
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="solicitacoes-capital-giro-${new Date().toISOString().split("T")[0]}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar Excel:", error);
    return new NextResponse("Erro interno ao gerar Excel", { status: 500 });
  }
}
