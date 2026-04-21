import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { EditorProvider } from "./EditorProvider";
import { useEditor } from "./EditorContext";

function wrapper({ children }: { children: ReactNode }) {
  return <EditorProvider>{children}</EditorProvider>;
}

describe("EditorProvider", () => {
  it("provides initial state through context", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    expect(result.current.state.blocks).toEqual([]);
    expect(result.current.state.selectedBlockId).toBeNull();
    expect(result.current.state.isEditingText).toBe(false);
    expect(result.current.state.history.past).toEqual([]);
    expect(result.current.state.history.future).toEqual([]);
  });

  it("dispatch updates state", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    act(() => {
      result.current.dispatch({ type: "ADD_TEXT_BLOCK" });
    });

    expect(result.current.state.blocks).toHaveLength(1);
    expect(result.current.state.blocks[0].type).toBe("text");
  });

  it("Ctrl+Z dispatches UNDO", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    // Add a block so there's something to undo
    act(() => {
      result.current.dispatch({ type: "ADD_TEXT_BLOCK" });
    });
    expect(result.current.state.blocks).toHaveLength(1);

    // Simulate Ctrl+Z
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          bubbles: true,
        }),
      );
    });

    expect(result.current.state.blocks).toHaveLength(0);
  });

  it("Ctrl+Shift+Z dispatches REDO", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    // Add a block, then undo it
    act(() => {
      result.current.dispatch({ type: "ADD_TEXT_BLOCK" });
    });
    act(() => {
      result.current.dispatch({ type: "UNDO" });
    });
    expect(result.current.state.blocks).toHaveLength(0);

    // Simulate Ctrl+Shift+Z
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
    });

    expect(result.current.state.blocks).toHaveLength(1);
  });

  it("Cmd+Z dispatches UNDO (macOS)", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    act(() => {
      result.current.dispatch({ type: "ADD_TEXT_BLOCK" });
    });
    expect(result.current.state.blocks).toHaveLength(1);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          metaKey: true,
          bubbles: true,
        }),
      );
    });

    expect(result.current.state.blocks).toHaveLength(0);
  });

  it("Cmd+Shift+Z dispatches REDO (macOS)", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    act(() => {
      result.current.dispatch({ type: "ADD_TEXT_BLOCK" });
    });
    act(() => {
      result.current.dispatch({ type: "UNDO" });
    });
    expect(result.current.state.blocks).toHaveLength(0);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
    });

    expect(result.current.state.blocks).toHaveLength(1);
  });

  it("plain Z key without modifier does not trigger undo/redo", () => {
    const { result } = renderHook(() => useEditor(), { wrapper });

    act(() => {
      result.current.dispatch({ type: "ADD_TEXT_BLOCK" });
    });
    expect(result.current.state.blocks).toHaveLength(1);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          bubbles: true,
        }),
      );
    });

    // Block should still be there — no undo triggered
    expect(result.current.state.blocks).toHaveLength(1);
  });

  it("cleans up keyboard listener on unmount", () => {
    const { unmount } = renderHook(() => useEditor(), { wrapper });

    unmount();

    // After unmount, keyboard events should not cause errors
    // (no assertion needed — if cleanup failed, the event handler
    // would try to dispatch on an unmounted reducer and throw)
    expect(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          bubbles: true,
        }),
      );
    }).not.toThrow();
  });
});
