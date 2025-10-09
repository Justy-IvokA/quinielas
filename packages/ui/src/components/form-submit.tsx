"use client";

import { useState } from "react";
import { Button } from "./button";
import { toastPromise } from "../lib/toast";

export interface FormSubmitProps {
  onSubmit: () => Promise<unknown>;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Form submit button with integrated toast promise handling
 * Shows loading, success, and error toasts automatically
 */
export function FormSubmit({
  onSubmit,
  loadingText = "Procesando...",
  successText = "¡Operación exitosa!",
  errorText = "Ocurrió un error",
  children,
  variant = "default",
  size = "default"
}: FormSubmitProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await toastPromise(onSubmit(), {
        loading: loadingText,
        success: successText,
        error: (err) => {
          if (err instanceof Error) {
            return `${errorText}: ${err.message}`;
          }
          return errorText;
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubmit}
      disabled={isLoading}
      variant={variant}
      size={size}
    >
      {isLoading ? loadingText : children}
    </Button>
  );
}
