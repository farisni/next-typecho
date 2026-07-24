"use client";

import type { ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BulkMenuAction = {
  icon: LucideIcon;
  label: ReactNode;
  name?: string;
  value?: string;
  variant?: "default" | "destructive";
};

type AdminBulkMenuProps = {
  formId: string;
  actions: BulkMenuAction[];
};

export function AdminBulkMenu({ formId, actions }: AdminBulkMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none bg-[#f6f6f3]"
          />
        )}
      >
        选中项
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-none">
        <DropdownMenuGroup>
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <DropdownMenuItem
                key={`${action.name ?? "action"}-${action.value ?? index}`}
                className="w-full rounded-none"
                nativeButton
                variant={action.variant}
                render={(
                  <button
                    form={formId}
                    type="submit"
                    name={action.name}
                    value={action.value}
                  />
                )}
              >
                <Icon />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
