import { cn } from "@nextui-org/react";
import { HTMLAttributes, useEffect, useState } from "react";

interface EditorActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  className: HTMLAttributes<HTMLButtonElement>["className"];
}

function EditorActionButton({
  onClick,
  disabled,
  className,
  children,
}: React.PropsWithChildren<EditorActionButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-sm py-0.5 rounded w-20",
        "hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface EditorActionsProps {
  onSave: () => void;
  onDiscard: () => void;
  onOpenVSCode: () => void;
  onSelectText: () => void;
  isDisabled: boolean;
  selectedText: string | null;
}

export function EditorActions({
  onSave,
  onDiscard,
  onOpenVSCode,
  onSelectText,
  isDisabled,
  selectedText,
}: EditorActionsProps) {



  return (
    <div className="flex gap-2">
      <EditorActionButton
        onClick={onSave}
        disabled={isDisabled}
        className="bg-neutral-800 disabled:hover:bg-neutral-800"
      >
        Save
      </EditorActionButton>

      <EditorActionButton
        onClick={onDiscard}
        disabled={isDisabled}
        className="border border-neutral-800 disabled:hover:bg-transparent"
      >
        Discard
      </EditorActionButton>

      <EditorActionButton
        onClick={onOpenVSCode}
        disabled={false} // 打开VSCode的按钮通常不禁用
        className="bg-blue-600 hover:bg-blue-700"
      >
        Open in VSCode
      </EditorActionButton>

      <EditorActionButton
        onClick={onSelectText}
        disabled={!selectedText} // 根据选中的文本来启用按钮
        className="bg-green-600 hover:bg-green-700"
      >
        Language Transform
      </EditorActionButton>

    </div>
  );
}
