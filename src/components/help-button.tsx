"use client";

import { CircleHelpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorial } from "@/components/tutorial-provider";

export function HelpButton() {
  const { show } = useTutorial();

  return (
    <Button variant="ghost" size="sm" onClick={show}>
      <CircleHelpIcon />
      Need help?
    </Button>
  );
}
