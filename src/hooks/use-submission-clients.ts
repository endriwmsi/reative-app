"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type GetAllSubmissionClientsParams,
  getAllSubmissionClients,
  type UpdateClientStatusBulkParams,
  updateClientStatusBulk,
  updateSingleClientStatus,
} from "@/actions/submission/submission-client-admin.action";
import type { SubmissionClientStatus } from "@/db/schema";

// Query key factory
export const submissionClientsKeys = {
  all: ["submissionClients"] as const,
  lists: () => [...submissionClientsKeys.all, "list"] as const,
  list: (params: GetAllSubmissionClientsParams) =>
    [...submissionClientsKeys.lists(), params] as const,
};

// Hook para buscar clientes com filtros e paginação
export function useSubmissionClients(params: GetAllSubmissionClientsParams) {
  return useQuery({
    queryKey: submissionClientsKeys.list(params),
    queryFn: () => getAllSubmissionClients(params),
    placeholderData: (previousData) => previousData,
  });
}

// Hook para atualizar status individual
export function useUpdateClientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientId,
      newStatus,
    }: {
      clientId: string;
      newStatus: SubmissionClientStatus;
    }) => updateSingleClientStatus(clientId, newStatus),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Status atualizado com sucesso");
        queryClient.invalidateQueries({
          queryKey: submissionClientsKeys.lists(),
        });
      } else {
        toast.error(data.error || "Erro ao atualizar status");
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });
}

// Hook para atualizar status em bulk
export function useUpdateClientStatusBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateClientStatusBulkParams) =>
      updateClientStatusBulk(params),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(
          `${data.updatedCount} cliente(s) atualizado(s) com sucesso`,
        );
        queryClient.invalidateQueries({
          queryKey: submissionClientsKeys.lists(),
        });
      } else {
        toast.error(data.error || "Erro ao atualizar status dos clientes");
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar status dos clientes");
    },
  });
}
