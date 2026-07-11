"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type NumberFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  defaultValue?: string | number;
  step?: number;
  onValueChange?: (value: string) => void;
};

function adjustValue(
  current: string,
  direction: 1 | -1,
  min: number,
  step: number,
): string {
  if (current === "") {
    return direction > 0 ? String(Math.max(min, step)) : "";
  }

  const parsed = Number(current);
  if (Number.isNaN(parsed)) {
    return direction > 0 ? String(Math.max(min, step)) : "";
  }

  const next = Math.max(min, parsed + direction * step);
  return String(next);
}

export function NumberField({
  className,
  defaultValue = "",
  min = 0,
  step = 1,
  onValueChange,
  id,
  name,
  placeholder,
  "aria-label": ariaLabel,
  ...props
}: NumberFieldProps) {
  const [value, setValue] = React.useState(() =>
    defaultValue === undefined || defaultValue === null
      ? ""
      : String(defaultValue),
  );

  const updateValue = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  const handleStep = (direction: 1 | -1) => {
    updateValue(adjustValue(value, direction, Number(min), step));
  };

  return (
    <div className="flex h-14 items-stretch border-b border-border bg-transparent">
      <input
        {...props}
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => updateValue(event.target.value)}
        className={cn(
          "number-field-input min-w-0 flex-1 border-0 bg-transparent px-3 text-center font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus-visible:ring-0",
          className,
        )}
      />
      <div
        className="flex w-10 shrink-0 flex-col border-l border-border bg-secondary/50"
        role="group"
        aria-label={ariaLabel ? `${ariaLabel} stepper` : "Number stepper"}
      >
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-accent/15 hover:text-accent focus:outline-none focus-visible:bg-accent/15 focus-visible:text-accent"
          aria-label={ariaLabel ? `Increase ${ariaLabel}` : "Increase value"}
        >
          <ChevronUp className="h-3 w-3" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="flex flex-1 items-center justify-center border-t border-border text-muted-foreground transition-colors hover:bg-accent/15 hover:text-accent focus:outline-none focus-visible:bg-accent/15 focus-visible:text-accent"
          aria-label={ariaLabel ? `Decrease ${ariaLabel}` : "Decrease value"}
        >
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
