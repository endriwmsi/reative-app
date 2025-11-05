/**
 * Constantes para status de submissions e clientes
 */

export const SUBMISSION_STATUS = {
  AGUARDANDO: "aguardando",
  PROCESSANDO: "processando",
  PARCIALMENTE_CONCLUIDO: "parcialmente_concluido",
  CONCLUIDO: "concluido",
  PARCIALMENTE_REJEITADO: "parcialmente_rejeitado",
  REJEITADO: "rejeitado",
  EM_ANALISE_JURIDICA: "em_analise_juridica",
  FINALIZADO: "finalizado",
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

export const CLIENT_STATUS = {
  PENDENTE: "pendente",
  PROCESSANDO: "processando",
  APROVADO: "aprovado",
  REJEITADO: "rejeitado",
  DEFERIDO: "deferido",
  INDEFERIDO: "indeferido",
  EM_ANALISE: "em_analise",
  FINALIZADO: "finalizado",
  CANCELADO: "cancelado",
} as const;

export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

/**
 * Mapeamento de status para grupos funcionais
 */
export const STATUS_GROUPS = {
  POSITIVE: [CLIENT_STATUS.APROVADO, CLIENT_STATUS.DEFERIDO],
  NEGATIVE: [
    CLIENT_STATUS.REJEITADO,
    CLIENT_STATUS.INDEFERIDO,
    CLIENT_STATUS.CANCELADO,
  ],
  ANALYSIS: [CLIENT_STATUS.PROCESSANDO, CLIENT_STATUS.EM_ANALISE],
  COMPLETED: [CLIENT_STATUS.FINALIZADO],
  PENDING: [CLIENT_STATUS.PENDENTE],
} as const;
