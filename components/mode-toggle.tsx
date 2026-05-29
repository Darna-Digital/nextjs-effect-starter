"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Select } from "@/components/ui/select";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes resolves the active theme only on the client, so render a
  // placeholder until mounted to avoid a hydration mismatch on the value.
  useEffect(() => setMounted(true), []);

  return (
    <Select
      aria-label="Theme"
      containerClassName="w-28"
      value={mounted ? theme : "system"}
      onChange={(e) => setTheme(e.target.value)}
    >
      <option value="system">Auto</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </Select>
  );
}
