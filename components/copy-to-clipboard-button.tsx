"use client";

import { CopyIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";

export const CopyToClipboardButton = ({
  txtToCopy,
}: {
  txtToCopy: string | undefined | null;
}) => {
  const copyToClipboard = async () => {
    if (!txtToCopy) return;
    await navigator.clipboard
      .writeText(txtToCopy)
      .catch(() => toast.error("Error copying to clipboard"))
      .finally(() => toast.success("Copied to clipboard"));
  };

  if (!txtToCopy) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          aria-label="Copy numbers to clipboard"
        >
          <CopyIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy numbers</TooltipContent>
    </Tooltip>
  );
};
