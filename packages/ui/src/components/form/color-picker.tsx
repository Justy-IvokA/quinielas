"use client";

import * as React from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { cn } from "../../lib/cn";

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({
  value = "#000000",
  onChange,
  label,
  className
}: ColorPickerProps) {
  const [color, setColor] = React.useState(value);

  const handleChange = (newColor: string) => {
    setColor(newColor);
    onChange?.(newColor);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-10 p-0"
              style={{ backgroundColor: color }}
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <HexColorPicker color={color} onChange={handleChange} />
            <div className="mt-3">
              <HexColorInput
                color={color}
                onChange={handleChange}
                prefixed
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </PopoverContent>
        </Popover>
        <Input
          type="text"
          value={color}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
