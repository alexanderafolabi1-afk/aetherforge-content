import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

function Toaster({ ...props }: ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[var(--shadow-border)]",
          description: "group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
