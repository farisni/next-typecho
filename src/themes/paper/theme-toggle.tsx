"use client";

import { useEffect, useState } from "react";

const storageKey = "paper-color-mode";

function applyMode(mode: "light" | "dark") {
  document.querySelector<HTMLElement>(".theme-paper")?.setAttribute("data-paper-theme", mode);
}

export function PaperThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedMode = window.localStorage.getItem(storageKey);
    const initialMode =
      savedMode === "dark" ||
      (savedMode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";

    setMode(initialMode);
    applyMode(initialMode);
  }, []);

  function toggleMode() {
    const nextMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
    applyMode(nextMode);
    window.localStorage.setItem(storageKey, nextMode);
  }

  return (
    <button
      aria-label={mode === "dark" ? "切换浅色主题" : "切换深色主题"}
      onClick={toggleMode}
      type="button"
    >
      {mode === "dark" ? (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M20.35 15.35A9 9 0 0 1 8.65 3.65a9 9 0 1 0 11.7 11.7Z" />
        </svg>
      )}
    </button>
  );
}
