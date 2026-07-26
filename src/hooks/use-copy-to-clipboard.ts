"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard({ timeout = 1500 }: { timeout?: number } = {}) {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) return false;
      }

      setIsCopied(true);
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        setIsCopied(false);
        resetTimerRef.current = null;
      }, timeout);
      return true;
    } catch {
      return false;
    }
  }, [timeout]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return { isCopied, copyToClipboard };
}
