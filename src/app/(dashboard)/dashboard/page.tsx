import UnderConstructionSVG from "@/components/layout/under-construction";

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-8rem)] justify-center items-center gap-4">
      <UnderConstructionSVG className="w-32 h-32 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Essa página está em construção!</h1>
        <p className="text-muted-foreground">
          Estamos trabalhando para trazer novidades em breve.
        </p>
      </div>
    </div>
  );
}
