/**
 * Constantes para status de submissions e clientes
 */

export const SUBMISSION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

export const CLIENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

/**
 * Mapeamento de status para grupos funcionais
 */
export const STATUS_GROUPS = {
  POSITIVE: [CLIENT_STATUS.APPROVED],
  NEGATIVE: [CLIENT_STATUS.REJECTED, CLIENT_STATUS.CANCELLED],
  PROCESSING: [CLIENT_STATUS.PROCESSING],
  PENDING: [CLIENT_STATUS.PENDING],
} as const;
