"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpandedCardHeaderProps {
  onClose: () => void;
}

export function ExpandedCardHeader({ onClose }: ExpandedCardHeaderProps) {
  return (
    <Button
      className="absolute right-2 top-2 z-20"
      onClick={onClose}
      size="icon"
      variant="ghost"
    >
      <XIcon className="size-5" />
    </Button>
  );
}
