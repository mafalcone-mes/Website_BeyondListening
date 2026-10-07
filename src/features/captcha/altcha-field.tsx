"use client";
import type {} from "altcha/types/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

/**
 * ALTCHA widget. Solves a small proof-of-work puzzle in the background as soon
 * as the form appears and puts the result in a hidden "altcha" form field.
 * No cookies, no third parties. `onVerified` lets forms wait for it.
 */
export function AltchaField({ name = "altcha", onVerified }: { name?: string; onVerified?: (ok: boolean) => void }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const report = useEffectEvent((ok: boolean) => onVerified?.(ok));

  useEffect(() => {
    import("altcha").then(() => setReady(true)).catch(() => setReady(false));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onState = (e: Event) => report((e as CustomEvent<{ state: string }>).detail?.state === "verified");
    el.addEventListener("statechange", onState);
    return () => el.removeEventListener("statechange", onState);
  }, [ready]);

  if (!ready) return <input type="hidden" name={name} value="" />;
  return (
    <altcha-widget
      ref={ref}
      challenge="/api/altcha/challenge"
      name={name}
      auto="onload"
      style={{ "--altcha-max-width": "100%" } as React.CSSProperties}
    />
  );
}
