"use client";

import { CircleHelpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorial } from "@/components/tutorial-provider";

export function HelpButton() {
  const { show } = useTutorial();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={show}
      aria-label="Need help?"
      className="max-md:size-8 max-md:px-0"
    >
      <CircleHelpIcon />
      <span className="max-md:sr-only">Need help?</span>
    </Button>
  );
}
