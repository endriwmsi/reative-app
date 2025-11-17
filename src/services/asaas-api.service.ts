import type {
  AsaasAPIResponse,
  AsaasConfig,
  AsaasCustomer,
  AsaasCustomersListResponse,
  AsaasPayment,
  AsaasPaymentBillingInfo,
  AsaasPaymentResponse,
} from "@/types/payment";

/**
 * Service para interação com a API do Asaas
 * Responsável apenas pelas operações de API, sem lógica de negócio
 */
export class AsaasAPIService {
  private readonly config: AsaasConfig;

  constructor() {
    this.config = {
      baseURL:
        process.env.ASAAS_API_URL ||
        (process.env.ASAAS_ENVIRONMENT === "production"
          ? "https://api.asaas.com/v3"
          : "https://sandbox.asaas.com/v3"),
      apiKey: `$aact_${process.env.ASAAS_API_KEY || ""}`,
      environment:
        (process.env.ASAAS_ENVIRONMENT as "production" | "sandbox") ||
        "sandbox",
    };

    console.log("[AsaasAPI] Configuration:", {
      baseURL: this.config.baseURL,
      environment: this.config.environment,
      hasApiKey: !!this.config.apiKey,
      apiKeyPrefix: `${this.config.apiKey.substring(0, 10)}...`,
    });
  }

  /**
   * Método genérico para fazer requisições à API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "ReativeApp/1.0 (Next.js; production)",
      access_token: this.config.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(
      `[AsaasAPI] ${options.method || "GET"} ${endpoint} - Status: ${response.status}`,
    );

    console.log("[AsaasAPI] Request details:", {
      url,
      headers: {
        ...headers,
        access_token: headers.access_token?.substring(0, 15) + "...",
      },
      method: options.method || "GET",
    });

    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorText = await response.text();
        console.error("[AsaasAPI] Error Response:", errorText);

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            errorDetail = errorJson.errors
              .map(
                (err: Record<string, unknown>) =>
                  err.description || err.message || err,
              )
              .join("; ");
          } else if (errorJson.message) {
            errorDetail = errorJson.message;
          } else {
            errorDetail = errorText;
          }
        } catch {
          errorDetail = errorText;
        }
      } catch {
        errorDetail = `HTTP ${response.status}`;
      }

      console.error("[AsaasAPI] Error:", {
        status: response.status,
        statusText: response.statusText,
        detail: errorDetail,
        url: url,
      });

      throw new Error(`Asaas API Error: ${response.status} - ${errorDetail}`);
    }

    // Verificar se a resposta é JSON válido
    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      console.error(
        "[AsaasAPI] Invalid JSON response:",
        responseText.substring(0, 200),
      );
      throw new Error(
        "API retornou resposta inválida (não é JSON). Verifique a configuração da API key.",
      );
    }
  }

  /**
   * Testa a conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("[AsaasAPI] Testing connection...");
      await this.request<AsaasCustomersListResponse>("/customers?limit=1");
      console.log("[AsaasAPI] Connection test successful");
      return true;
    } catch (error) {
      console.error("[AsaasAPI] Connection test failed:", error);
      return false;
    }
  }

  /**
   * Cria um novo cliente
   */
  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
  }

  /**
   * Busca cliente por CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer[]> {
    const response = await this.request<AsaasCustomersListResponse>(
      `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`,
    );
    return response.data || [];
  }

  /**
   * Busca cliente por email
   */
  async getCustomerByEmail(email: string): Promise<AsaasCustomer[]> {
    const response = await this.request<AsaasCustomersListResponse>(
      `/customers?email=${encodeURIComponent(email)}`,
    );
    return response.data || [];
  }

  /**
   * Cria um novo pagamento
   */
  async createPayment(payment: AsaasPayment): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>("/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    });
  }

  /**
   * Busca dados de um pagamento
   */
  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  /**
   * Busca informações de cobrança (QR Code PIX, etc)
   */
  async getPaymentBillingInfo(
    paymentId: string,
  ): Promise<AsaasPaymentBillingInfo> {
    return this.request<AsaasPaymentBillingInfo>(
      `/payments/${paymentId}/billingInfo`,
    );
  }

  /**
   * Busca ou cria um cliente
   */
  async getOrCreateCustomer(
    customer: AsaasCustomer,
  ): Promise<AsaasAPIResponse<AsaasCustomer>> {
    try {
      // Tentar encontrar por CPF/CNPJ primeiro
      if (customer.cpfCnpj) {
        const existingCustomers = await this.getCustomerByCpfCnpj(
          customer.cpfCnpj,
        );
        if (existingCustomers && existingCustomers.length > 0) {
          return {
            success: true,
            data: existingCustomers[0],
            message: "Cliente encontrado por CPF/CNPJ",
          };
        }
      }

      // Se não encontrou por CPF/CNPJ, tentar por email
      if (customer.email) {
        const existingCustomers = await this.getCustomerByEmail(customer.email);
        if (existingCustomers && existingCustomers.length > 0) {
          return {
            success: true,
            data: existingCustomers[0],
            message: "Cliente encontrado por email",
          };
        }
      }

      // Se não encontrou, criar novo cliente
      const newCustomer = await this.createCustomer(customer);
      return {
        success: true,
        data: newCustomer,
        message: "Cliente criado com sucesso",
      };
    } catch (error) {
      console.error("[AsaasAPI] Error in getOrCreateCustomer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        message: "Falha ao buscar/criar cliente",
      };
    }
  }
}
