export interface AsaasCustomersListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomer[];
}

export interface AsaasCustomer {
  id?: string; // ID é opcional ao criar, mas obrigatório na resposta
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: "PIX";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  value: number;
  netValue: number;
  originalValue: number;
  billingType: string;
  status: string;
  pixTransaction?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  invoiceUrl?: string;
  confirmedDate?: string;
}

export interface AsaasPaymentBillingInfo {
  object: string;
  pix?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
    description: string;
  };
}

const baseURL =
  process.env.ASAAS_ENVIRONMENT === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const apiKey = `$aact_hmlg_${process.env.ASAAS_API_KEY}` || "";

export class AsaasAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorText = await response.text();
        console.error("Asaas API Error Response:", errorText);

        // Tentar fazer parse do JSON do erro para obter mais detalhes
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

      console.error("Asaas API Error:", {
        status: response.status,
        statusText: response.statusText,
        detail: errorDetail,
        url: url,
      });

      throw new Error(`Asaas API Error: ${response.status} - ${errorDetail}`);
    }

    return response.json();
  }

  // Método para testar a conexão com a API
  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing Asaas API connection...");
      const response =
        await this.request<AsaasCustomersListResponse>("/customers?limit=1");
      console.log("Connection test successful:", response);
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
  }

  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer[]> {
    const response = await this.request<AsaasCustomersListResponse>(
      `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`,
    );
    return response.data || [];
  }

  async getCustomerByEmail(email: string): Promise<AsaasCustomer[]> {
    const response = await this.request<AsaasCustomersListResponse>(
      `/customers?email=${encodeURIComponent(email)}`,
    );
    return response.data || [];
  }

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

  async createPayment(payment: AsaasPayment): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>("/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    });
  }

  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  async getPaymentBillingInfo(
    paymentId: string,
  ): Promise<AsaasPaymentBillingInfo> {
    return this.request<AsaasPaymentBillingInfo>(
      `/payments/${paymentId}/billingInfo`,
    );
  }

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

    console.log("=== Creating PIX Payment ===");
    console.log("Payment data:", payment);
    console.log("Description length:", limitedDescription.length);
    console.log(
      "ExternalReference length:",
      limitedExternalReference?.length || 0,
    );

    let createdPayment: AsaasPaymentResponse;
    try {
      // Criar o pagamento
      createdPayment = await this.createPayment(payment);
      console.log("Payment created successfully:", createdPayment);
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }

    // Buscar as informações de cobrança para obter os dados do PIX
    try {
      const billingInfo = await this.getPaymentBillingInfo(createdPayment.id);
      console.log("Billing info retrieved:", billingInfo);

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
        "Failed to get billing info, returning payment without PIX data:",
        error,
      );
      return createdPayment;
    }
  }
}

export const asaas = new AsaasAPI();
