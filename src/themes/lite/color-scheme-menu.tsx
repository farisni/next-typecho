"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type HandsomeColorScheme = "default" | "mint";

const storageKey = "handsome-color-scheme";

const schemes: Array<{
  value: HandsomeColorScheme;
  label: string;
  swatch: string;
}> = [
  { value: "default", label: "默认深顶栏", swatch: "#343b4f" },
  { value: "mint", label: "薄荷青灰", swatch: "#dfece7" },
];

function applyScheme(scheme: HandsomeColorScheme) {
  const theme = document.querySelector(".theme-handsome");
  if (!theme) return;

  theme.classList.toggle("handsome-color-mint", scheme === "mint");
}

export function ColorSchemeMenu({
  initialScheme,
}: {
  initialScheme: HandsomeColorScheme;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [scheme, setScheme] = useState<HandsomeColorScheme>(initialScheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const nextScheme =
      stored === "default" || stored === "mint" ? stored : initialScheme;

    setScheme(nextScheme);
    applyScheme(nextScheme);
  }, [initialScheme]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectScheme = (nextScheme: HandsomeColorScheme) => {
    setScheme(nextScheme);
    applyScheme(nextScheme);
    window.localStorage.setItem(storageKey, nextScheme);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="handsome-color-menu">
      <button
        className="handsome-color-menu-trigger"
        type="button"
        aria-label="切换色系"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Palette aria-hidden="true" />
        <ChevronDown className="handsome-color-menu-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div className="handsome-color-menu-panel" role="menu" aria-label="选择色系">
          {schemes.map((item) => (
            <button
              key={item.value}
              className={item.value === scheme ? "is-active" : undefined}
              type="button"
              role="menuitemradio"
              aria-checked={item.value === scheme}
              onClick={() => selectScheme(item.value)}
            >
              <span
                className="handsome-color-menu-swatch"
                style={{ backgroundColor: item.swatch }}
                aria-hidden="true"
              />
              <span>{item.label}</span>
              {item.value === scheme ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
