"use client";

import { createContext, useContext, type ReactNode } from "react";

type ShapeTokens = {
  bg: string;
  focusRing: string;
};

const defaultShape: ShapeTokens = {
  bg: "rounded-lg",
  focusRing: "rounded-lg",
};

const ShapeContext = createContext<ShapeTokens>(defaultShape);

export function ShapeProvider({
  children,
  shape = defaultShape,
}: {
  children: ReactNode;
  shape?: Partial<ShapeTokens>;
}) {
  return (
    <ShapeContext.Provider value={{ ...defaultShape, ...shape }}>
      {children}
    </ShapeContext.Provider>
  );
}

export function useShape() {
  return useContext(ShapeContext);
}
