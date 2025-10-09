"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Label } from "../label";
import { cn } from "../../lib/cn";

export interface FormFieldProps {
  name?: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode | ((field: any) => React.ReactElement);
}

export function FormField({
  name,
  label,
  description,
  required,
  className,
  htmlFor,
  error: externalError,
  children
}: FormFieldProps) {
  // Support both controlled (with react-hook-form) and uncontrolled usage
  const formContext = useFormContext?.();
  const control = formContext?.control;
  const formErrors = formContext?.formState?.errors;
  
  const fieldName = name || htmlFor;
  const error = externalError || (fieldName && formErrors?.[fieldName]);

  // If children is a function and we have a control, use Controller
  if (typeof children === "function" && control && fieldName) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={fieldName} variant={error ? "error" : "default"}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Controller
          name={fieldName}
          control={control}
          render={({ field }) => children(field)}
        />
        {description && !error && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">
            {typeof error === "string" ? error : (error as any).message}
          </p>
        )}
      </div>
    );
  }

  // Otherwise, render as a simple field wrapper (uncontrolled)
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={htmlFor || fieldName} variant={error ? "error" : "default"}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children as React.ReactNode}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          {typeof error === "string" ? error : (error as any).message}
        </p>
      )}
    </div>
  );
}
