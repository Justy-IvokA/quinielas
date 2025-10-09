"use client";

import * as React from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { cn } from "../../lib/cn";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void | Promise<void>;
}

export function Form({ form, onSubmit, children, className, ...props }: FormProps) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
