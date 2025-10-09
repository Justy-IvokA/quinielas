"use client";

import * as React from "react";
import ReactSelect, { Props as ReactSelectProps } from "react-select";
import { useTheme } from "next-themes";
import { cn } from "../../lib/cn";

export interface SelectFieldOption {
  value: string;
  label: string;
  isDisabled?: boolean;
}

export interface SelectFieldProps extends Omit<ReactSelectProps, "theme"> {
  options: SelectFieldOption[];
  error?: boolean;
}

export function SelectField({ options, error, className, ...props }: SelectFieldProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <ReactSelect
      options={options}
      className={cn("react-select-container", className)}
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
          borderColor: error
            ? "hsl(0 84.2% 60.2%)"
            : state.isFocused
            ? "hsl(221.2 83.2% 53.3%)"
            : "hsl(214.3 31.8% 91.4%)",
          borderRadius: "0.375rem",
          minHeight: "2.5rem",
          boxShadow: state.isFocused
            ? error
              ? "0 0 0 2px hsla(0, 84.2%, 60.2%, 0.2)"
              : "0 0 0 2px hsla(221.2, 83.2%, 53.3%, 0.2)"
            : "none",
          "&:hover": {
            borderColor: error
              ? "hsl(0 84.2% 60.2%)"
              : "hsl(221.2 83.2% 53.3%)"
          }
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
          border: `1px solid ${isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)"}`,
          borderRadius: "0.375rem",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          zIndex: 50
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? "hsl(221.2 83.2% 53.3%)"
            : state.isFocused
            ? isDark
              ? "hsl(217.2 32.6% 17.5%)"
              : "hsl(210 40% 96.1%)"
            : "transparent",
          color: state.isSelected
            ? "hsl(210 40% 98%)"
            : isDark
            ? "hsl(210 40% 98%)"
            : "hsl(222.2 84% 4.9%)",
          cursor: state.isDisabled ? "not-allowed" : "pointer",
          "&:active": {
            backgroundColor: state.isDisabled
              ? undefined
              : "hsl(221.2 83.2% 53.3%)"
          }
        }),
        singleValue: (base) => ({
          ...base,
          color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)"
        }),
        input: (base) => ({
          ...base,
          color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)"
        }),
        placeholder: (base) => ({
          ...base,
          color: isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)"
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(210 40% 96.1%)"
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)"
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
          "&:hover": {
            backgroundColor: "hsl(0 84.2% 60.2%)",
            color: "hsl(210 40% 98%)"
          }
        })
      }}
      {...props}
    />
  );
}
