import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { EditorContext, useEditor } from "./EditorContext";
import type { EditorContextValue } from "./EditorContext";
import { initialState } from "../constants";

describe("useEditor", () => {
  it("throws when used outside EditorProvider", () => {
    expect(() => renderHook(() => useEditor())).toThrow(
      "useEditor must be used within an EditorProvider",
    );
  });

  it("returns context value when used inside a provider", () => {
    const mockDispatch = () => {};
    const value: EditorContextValue = {
      state: initialState,
      dispatch: mockDispatch,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditor(), { wrapper });

    expect(result.current.state).toBe(initialState);
    expect(result.current.dispatch).toBe(mockDispatch);
  });
});
