// Interfaces base do Asaas
export interface AsaasCustomersListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomer[];
}

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
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "DEBIT_CARD";
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
  originalValue?: number;
  billingType: string;
  status: AsaasPaymentStatus;
  pixTransaction?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  invoiceUrl?: string;
  confirmedDate?: string;
  paymentDate?: string;
  externalReference?: string;
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

// Status de pagamento do Asaas
export type AsaasPaymentStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "RECEIVED"
  | "OVERDUE"
  | "CANCELLED"
  | "REFUNDED";

// Webhook interfaces
export interface AsaasWebhookEvent {
  id: string;
  event: AsaasWebhookEventType;
  dateCreated: string;
  payment: AsaasWebhookPayment;
}

export type AsaasWebhookEventType =
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_REFUNDED";

export interface AsaasWebhookPayment {
  object: "payment";
  id: string;
  dateCreated: string;
  customer: string;
  checkoutSession: string | null;
  paymentLink: string | null;
  value: number;
  netValue: number;
  originalValue: number | null;
  interestValue: number | null;
  description: string;
  billingType: string;
  confirmedDate: string | null;
  pixTransaction?: string;
  pixQrCodeId?: string;
  status: AsaasPaymentStatus;
  dueDate: string;
  originalDueDate: string;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  installmentNumber: number | null;
  invoiceUrl: string;
  invoiceNumber: string;
  externalReference: string | null;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate: string | null;
  estimatedCreditDate: string | null;
  transactionReceiptUrl: string | null;
  nossoNumero: string | null;
  bankSlipUrl: string | null;
  lastInvoiceViewedDate: string | null;
  lastBankSlipViewedDate: string | null;
  discount: {
    value: number;
    limitDate: string | null;
    dueDateLimitDays: number;
    type: "FIXED" | "PERCENTAGE";
  };
  fine: {
    value: number;
    type: "FIXED" | "PERCENTAGE";
  };
  interest: {
    value: number;
    type: "PERCENTAGE";
  };
  postalService: boolean;
  escrow: unknown | null;
  refunds: unknown | null;
}

// API Response types
export interface AsaasAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Configuration
export interface AsaasConfig {
  baseURL: string;
  apiKey: string;
  environment: "production" | "sandbox";
}
