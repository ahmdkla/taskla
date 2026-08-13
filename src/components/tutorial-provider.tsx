"use client";

import { createContext, useContext, useState } from "react";

type TutorialContextValue = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({
  children,
  initiallyOpen,
}: {
  children: React.ReactNode;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <TutorialContext.Provider
      value={{ open, show: () => setOpen(true), hide: () => setOpen(false) }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return ctx;
}
