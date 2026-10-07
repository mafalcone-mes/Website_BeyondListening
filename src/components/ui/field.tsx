import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cx } from "./utils";

const control =
  "w-full rounded-md border bg-surface-raised px-3 text-base text-fg placeholder:text-fg-subtle " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger";

/** Label + control + hint + error, correctly associated for screen readers. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional ? <span className="ml-1 font-normal text-fg-subtle">(optional)</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-fg-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, hint?: boolean, error?: boolean) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

export function TextInput({
  id,
  invalid,
  hasHint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { id: string; invalid?: boolean; hasHint?: boolean }) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, hasHint, invalid)}
      className={cx(control, "min-h-11 border-border-strong", className)}
      {...rest}
    />
  );
}

export function TextArea({
  id,
  invalid,
  hasHint,
  className,
  maxLength,
  value,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; invalid?: boolean; hasHint?: boolean; value: string }) {
  return (
    <div className="relative">
      <textarea
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(id, hasHint, invalid)}
        maxLength={maxLength}
        value={value}
        className={cx(control, "border-border-strong py-3 font-body text-lg leading-relaxed", className)}
        {...rest}
      />
      {maxLength ? (
        <p className="mt-1 text-right text-xs tabular-nums text-fg-subtle" aria-live="polite">
          {value.length.toLocaleString("en")} / {maxLength.toLocaleString("en")}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  children,
  invalid,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  invalid?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cx(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm leading-snug",
        invalid ? "border-danger" : "border-border",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        className="mt-0.5 size-5 shrink-0 accent-(--color-accent)"
      />
      <span>{children}</span>
    </label>
  );
}
