"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createPaymentForSubmissions,
  getPaymentData,
} from "@/actions/payment/payment.action";

export interface SubmissionItem {
  id: number;
  title: string;
  totalAmount: string;
  isPaid: boolean;
}

export interface PaymentHookData {
  paymentId: string;
  qrCode: string;
  pixCopyPaste: string;
  paymentUrl: string;
  totalAmount: number;
  submissionTitles: string[];
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentHookData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const createPayment = async (submissionIds: string[]) => {
    setLoading(true);

    try {
      const dataResult = await getPaymentData(submissionIds);

      if (!dataResult.success || !dataResult.data) {
        toast.error(dataResult.error || "Erro ao buscar dados das submissões");
        return;
      }

      const { submissions } = dataResult.data;

      const unpaidSubmissions = submissions.filter((sub) => !sub.isPaid);

      if (unpaidSubmissions.length === 0) {
        toast.error("Todas as submissões selecionadas já foram pagas");
        return;
      }

      if (unpaidSubmissions.length !== submissions.length) {
        toast.warning("Algumas submissões já foram pagas e serão ignoradas");
      }

      const unpaidIds = unpaidSubmissions.map((sub) => sub.id);
      const unpaidTotal = unpaidSubmissions.reduce(
        (total, sub) => total + parseFloat(sub.totalAmount),
        0,
      );

      const result = await createPaymentForSubmissions({
        submissionIds: unpaidIds,
        totalAmount: unpaidTotal,
      });

      if (result.success && result.data) {
        setPaymentData({
          paymentId: result.data.paymentId,
          qrCode: result.data.qrCode,
          pixCopyPaste: result.data.pixCopyPaste,
          paymentUrl: result.data.paymentUrl,
          totalAmount: unpaidTotal,
          submissionTitles: unpaidSubmissions.map((sub) => sub.title),
        });

        setShowPaymentModal(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      toast.error("Erro inesperado ao criar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = (open?: boolean) => {
    if (open === false || open === undefined) {
      setShowPaymentModal(false);
      setPaymentData(null);
    }
  };

  return {
    loading,
    paymentData,
    showPaymentModal,
    createPayment,
    closePaymentModal,
  };
}
