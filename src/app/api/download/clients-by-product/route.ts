import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getClientsGroupedByProduct } from "@/actions/submission/download-clients.action";
import { auth } from "@/auth";

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

    // Obter os IDs dos envios selecionados do body da requisição
    const body = await request.json();
    const submissionIds: string[] = body.submissionIds || [];

    if (submissionIds.length === 0) {
      return new NextResponse("Nenhum envio selecionado", { status: 400 });
    }

    // Buscar os dados
    const result = await getClientsGroupedByProduct(
      session.user.id,
      isAdmin,
      submissionIds,
    );

    if (!result.success || !result.data) {
      return new NextResponse(result.error || "Erro ao buscar dados", {
        status: 500,
      });
    }

    if (result.data.length === 0) {
      return new NextResponse("Nenhum cliente encontrado", { status: 404 });
    }

    const productGroups = result.data;

    // Criar um arquivo Excel com múltiplas abas (sheets) - uma para cada produto
    const workbook = XLSX.utils.book_new();

    // Função para limpar nome do sheet (remover caracteres especiais)
    const cleanSheetName = (name: string) => {
      return name.replace(/[\\/*?:[\]]/g, "").substring(0, 31); // Excel limita nomes de sheet a 31 caracteres
    };

    for (const productGroup of productGroups) {
      // Preparar dados para o Excel
      const sheetData = productGroup.clients.map((client) => ({
        "Nome do Cliente": client.clientName,
        Documento: client.clientDocument,
        "Status do Cliente": client.clientStatus,
        "Título do Envio": client.submissionTitle,
        "Data do Envio": new Date(client.submissionCreatedAt).toLocaleString(
          "pt-BR",
        ),
        "Status do Envio": client.submissionStatus,
        "Envio Pago": client.submissionIsPaid ? "Sim" : "Não",
        Responsável: client.userName,
        "Email do Responsável": client.userEmail,
      }));

      // Criar worksheet
      const worksheet = XLSX.utils.json_to_sheet(sheetData);

      // Ajustar largura das colunas
      const columnWidths = [
        { wch: 30 }, // Nome do Cliente
        { wch: 15 }, // Documento
        { wch: 20 }, // Status do Cliente
        { wch: 30 }, // Título do Envio
        { wch: 20 }, // Data do Envio
        { wch: 20 }, // Status do Envio
        { wch: 12 }, // Envio Pago
        { wch: 25 }, // Responsável
        { wch: 30 }, // Email do Responsável
      ];
      worksheet["!cols"] = columnWidths;

      // Nome da aba (sheet)
      const sheetName = cleanSheetName(
        `${productGroup.productName} (${productGroup.totalClients})`,
      );

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Gerar o arquivo Excel em buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Definir nome do arquivo
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `clientes-por-produto-${timestamp}.xlsx`;

    // Retornar o arquivo
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar download de clientes:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
