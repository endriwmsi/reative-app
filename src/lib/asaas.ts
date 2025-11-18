// Re-export da nova arquitetura para backward compatibility
export { AsaasAPIService as AsaasAPI } from "@/services/asaas/asaas-api.service";
export * from "@/types/payment/asaas.types";

import { AsaasAPIService } from "@/services/asaas/asaas-api.service";

// Instância global para backward compatibility
export const asaas = new AsaasAPIService();
