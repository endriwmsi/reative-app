"use client";

import { DataTable } from "@/components/data-table/data-table";
import type { CleanNameAction } from "@/db/schema/clean-name-action";
import { columns } from "./columns";

interface CleanNameActionsTableProps {
  data: CleanNameAction[];
}

export function CleanNameActionsTable({ data }: CleanNameActionsTableProps) {
  return <DataTable columns={columns} data={data} />;
}
