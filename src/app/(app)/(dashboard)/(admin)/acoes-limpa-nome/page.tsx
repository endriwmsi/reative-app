import { Plus } from "lucide-react";
import { getCleanNameActions } from "@/actions/clean-name-action/clean-name-action.action";
import { Button } from "@/components/ui/button";
import { CleanNameActionDialog } from "./_components/clean-name-action-dialog";
import { CleanNameActionsTable } from "./_components/clean-name-actions-table";

export default async function CleanNameActionsPage() {
  const result = await getCleanNameActions();
  const actions = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ações Limpa Nome</h1>
        <CleanNameActionDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ação
          </Button>
        </CleanNameActionDialog>
      </div>
      <CleanNameActionsTable data={actions} />
    </div>
  );
}
