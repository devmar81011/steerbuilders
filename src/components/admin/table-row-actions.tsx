import { type ReactNode } from "react";
import {
  EditIcon,
  IconButton,
  ProcessIcon,
  TrashIcon,
} from "@/components/ui/icon-button";

export {
  EditIcon,
  ProcessIcon,
  TrashIcon,
} from "@/components/ui/icon-button";

export function TableEditButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <IconButton label="Edit" variant="default" onClick={onClick} disabled={disabled}>
      <EditIcon />
    </IconButton>
  );
}

export function TableDeleteButton({
  onClick,
  disabled,
  label = "Delete",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <IconButton label={label} variant="danger" onClick={onClick} disabled={disabled}>
      <TrashIcon />
    </IconButton>
  );
}

export function TableProcessButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <IconButton label="Process" variant="success" onClick={onClick} disabled={disabled}>
      <ProcessIcon />
    </IconButton>
  );
}

export function TableRowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}
