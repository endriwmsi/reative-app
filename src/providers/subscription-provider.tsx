"use client";

import { createContext, useContext } from "react";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "trial"
  | "expired"
  | "cancelled"
  | "pending"
  | "none";

interface SubscriptionContextType {
  status: SubscriptionStatus;
  hasActiveSubscription: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export function SubscriptionProvider({
  children,
  status,
}: {
  children: React.ReactNode;
  status: SubscriptionStatus;
}) {
  const hasActiveSubscription = status === "active" || status === "trial";

  return (
    <SubscriptionContext.Provider value={{ status, hasActiveSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
