"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  const firstName = name.split(" ")[0];

  return (
    <span suppressHydrationWarning>
      {greeting}, {firstName}
    </span>
  );
}
