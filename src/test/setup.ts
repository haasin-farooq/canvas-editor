import { vi } from "vitest";

// jest-canvas-mock expects a global `jest` object at module load time.
// Provide a minimal shim that maps to Vitest equivalents.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = {
  fn: (impl?: (...args: unknown[]) => unknown) => vi.fn(impl),
  isMockFunction: (fn: unknown) => vi.isMockFunction(fn),
};

// Now safe to load jest-canvas-mock (it reads `jest.fn` and `jest.isMockFunction` at module scope)
await import("jest-canvas-mock");

import "@testing-library/jest-dom/vitest";
