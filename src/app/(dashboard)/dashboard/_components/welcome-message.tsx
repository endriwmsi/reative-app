import { headers } from "next/headers";
import { auth } from "@/auth";

const WelcomeMessage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.name) {
    return null;
  }

  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Bem-vindo de volta, {firstName}!
        </h1>
        <span className="text-2xl">{"👋"}</span>
      </div>
      <p className="text-muted-foreground">
        Aqui está um resumo das suas atividades.
      </p>
    </div>
  );
};

export default WelcomeMessage;
