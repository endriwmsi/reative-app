import type { AsaasWebhookEvent } from "./asaas.types";

// DTOs para webhook processing
export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  processed: boolean;
  paymentId?: string;
  submissionIds?: string[];
  error?: string;
}

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
  event?: AsaasWebhookEvent;
}

// DTOs para pagamento
export interface CreatePaymentDTO {
  submissionIds: string[];
  totalAmount: number;
  description?: string;
}

export interface PaymentCreationResult {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    qrCode: string;
    pixCopyPaste: string;
    paymentUrl: string;
    totalAmount: number;
    submissionTitles: string[];
  };
  error?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  message?: string;
  data?: {
    status: string;
    isPaid: boolean;
    confirmedDate?: string;
    paymentId: string;
  };
  error?: string;
}

// DTO para submission payment update
export interface SubmissionPaymentUpdate {
  paymentId: string;
  paymentStatus: string;
  paymentDate?: Date;
  isPaid: boolean;
  qrCodeData?: string;
  paymentUrl?: string;
}

// DTO para comissões
export interface CommissionCreationData {
  submissionId: string;
  amount: number;
  description: string;
}

export interface CommissionResult {
  success: boolean;
  commissionsCreated: number;
  error?: string;
}
