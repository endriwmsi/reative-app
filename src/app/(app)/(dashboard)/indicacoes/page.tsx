import type { Metadata } from "next";
import ReferralsTree from "./_components/referrals-tree";

export const metadata: Metadata = {
  title: "Hub LN - Indicações",
  description: "Gerenciar contas de usuários e aprovar novos cadastros.",
};

const ReferralsPage = () => {
  return <ReferralsTree />;
};

export default ReferralsPage;
