import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-card text-card-foreground shadow-soft",
        className,
      )}
      {...props}
    />
  );
}
