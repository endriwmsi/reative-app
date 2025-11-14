export interface AsaasCustomer {
  id?: string;
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
  externalReference?: string;
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

export interface AsaasCustomersListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomer[];
}

export interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    status: string;
    customer: string;
    value: number;
    externalReference?: string;
    dateCreated: string;
    confirmedDate?: string;
    // Outros campos conforme necessário
  };
  // Outros tipos de eventos podem ser adicionados aqui
}

export type PaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS";
