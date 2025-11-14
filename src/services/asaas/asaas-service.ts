import type {
  AsaasCustomer,
  AsaasCustomersListResponse,
  AsaasPayment,
  AsaasPaymentBillingInfo,
  AsaasPaymentResponse,
} from "./asaas-types";

/**
 * Classe para gerenciar as interações com a API do Asaas
 */
export class AsaasService {
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor() {
    this.baseURL =
      process.env.ASAAS_ENVIRONMENT === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/v3";

    // Resolve o problema da API key com $
    const apiKeyFromEnv = process.env.ASAAS_API_KEY || "";
    this.apiKey = apiKeyFromEnv.startsWith("$")
      ? apiKeyFromEnv
      : `$aact_${process.env.ASAAS_ENVIRONMENT === "production" ? "prod" : "hmlg"}_${apiKeyFromEnv}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      access_token: this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorText = await response.text();

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

      throw new Error(`Asaas API Error: ${response.status} - ${errorDetail}`);
    }

    return response.json();
  }

  /**
   * Testa a conexão com a API do Asaas
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request<AsaasCustomersListResponse>("/customers?limit=1");
      return true;
    } catch (error) {
      console.error("Falha no teste de conexão com Asaas:", error);
      return false;
    }
  }

  /**
   * Cria um novo cliente no Asaas
   */
  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
  }

  /**
   * Busca clientes por CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer[]> {
    const response = await this.request<AsaasCustomersListResponse>(
      `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`,
    );
    return response.data || [];
  }

  /**
   * Busca clientes por email
   */
  async getCustomerByEmail(email: string): Promise<AsaasCustomer[]> {
    const response = await this.request<AsaasCustomersListResponse>(
      `/customers?email=${encodeURIComponent(email)}`,
    );
    return response.data || [];
  }

  /**
   * Busca ou cria um cliente
   */
  async getOrCreateCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      // Primeiro, tentar encontrar por CPF/CNPJ se fornecido
      if (customer.cpfCnpj) {
        const existingCustomers = await this.getCustomerByCpfCnpj(
          customer.cpfCnpj,
        );
        if (existingCustomers && existingCustomers.length > 0) {
          return existingCustomers[0];
        }
      }

      // Se não encontrou por CPF/CNPJ, tentar por email
      if (customer.email) {
        const existingCustomers = await this.getCustomerByEmail(customer.email);
        if (existingCustomers && existingCustomers.length > 0) {
          return existingCustomers[0];
        }
      }

      // Se não encontrou, criar novo cliente
      return await this.createCustomer(customer);
    } catch (error) {
      // Se falhar na busca, tentar criar diretamente
      console.warn("Falha ao buscar cliente existente, criando novo:", error);
      return await this.createCustomer(customer);
    }
  }

  /**
   * Cria um pagamento
   */
  async createPayment(payment: AsaasPayment): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>("/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    });
  }

  /**
   * Busca um pagamento por ID
   */
  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  /**
   * Busca informações de cobrança (PIX)
   */
  async getPaymentBillingInfo(
    paymentId: string,
  ): Promise<AsaasPaymentBillingInfo> {
    return this.request<AsaasPaymentBillingInfo>(
      `/payments/${paymentId}/billingInfo`,
    );
  }

  /**
   * Cria um pagamento PIX completo com QR Code
   */
  async createPixPayment(
    customerId: string,
    value: number,
    description: string,
    externalReference?: string,
  ): Promise<AsaasPaymentResponse> {
    // Validações de entrada
    if (!customerId || customerId.trim() === "") {
      throw new Error("Customer ID é obrigatório");
    }

    if (!value || value <= 0) {
      throw new Error("Valor deve ser maior que zero");
    }

    // Limitar tamanhos para evitar erros da API
    const limitedDescription = description?.substring(0, 200) || "Pagamento";
    const limitedExternalReference = externalReference?.substring(0, 50);

    const payment: AsaasPayment = {
      customer: customerId,
      billingType: "PIX",
      value: Number(value.toFixed(2)), // Garantir 2 casas decimais
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 24h
      description: limitedDescription,
      externalReference: limitedExternalReference,
    };

    try {
      // Criar o pagamento
      const createdPayment = await this.createPayment(payment);

      // Buscar as informações de cobrança para obter os dados do PIX
      try {
        const billingInfo = await this.getPaymentBillingInfo(createdPayment.id);

        // Combinar os dados do pagamento com os dados do PIX
        return {
          ...createdPayment,
          pixTransaction: billingInfo.pix
            ? {
                encodedImage: billingInfo.pix.encodedImage,
                payload: billingInfo.pix.payload,
                expirationDate: billingInfo.pix.expirationDate,
              }
            : undefined,
        };
      } catch (error) {
        console.warn(
          "Falha ao obter informações de cobrança, retornando pagamento sem dados PIX:",
          error,
        );
        return createdPayment;
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      throw error;
    }
  }
}

// Instância singleton
export const asaasService = new AsaasService();
