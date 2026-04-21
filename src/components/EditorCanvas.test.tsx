import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { EditorCanvas } from "./EditorCanvas";
import { EditorContext } from "../context/EditorContext";
import type { EditorContextValue } from "../context/EditorContext";
import { initialState, CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";

function createWrapper(dispatch = vi.fn()) {
  const stageRef = { current: null };
  const value: EditorContextValue = {
    state: initialState,
    dispatch,
    stageRef,
  };

  return {
    dispatch,
    wrapper: ({ children }: { children: ReactNode }) => (
      <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
    ),
  };
}

describe("EditorCanvas", () => {
  it("renders without crashing", () => {
    const { wrapper } = createWrapper();
    expect(() => render(<EditorCanvas />, { wrapper })).not.toThrow();
  });

  it("renders a Konva Stage with a canvas element", () => {
    const { wrapper } = createWrapper();
    const { container } = render(<EditorCanvas />, { wrapper });

    // Konva Stage renders a div.konvajs-content with a canvas inside
    const stageDiv = container.querySelector(".konvajs-content");
    expect(stageDiv).toBeTruthy();

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders the Stage at the correct dimensions", () => {
    const { wrapper } = createWrapper();
    const { container } = render(<EditorCanvas />, { wrapper });

    const stageDiv = container.querySelector(".konvajs-content");
    expect(stageDiv).toBeTruthy();

    // Konva sets width/height on the stage container
    expect(stageDiv!.getAttribute("style")).toContain(
      `width: ${CANVAS_WIDTH}px`,
    );
    expect(stageDiv!.getAttribute("style")).toContain(
      `height: ${CANVAS_HEIGHT}px`,
    );
  });

  it("renders a canvas with correct dimensions", () => {
    const { wrapper } = createWrapper();
    const { container } = render(<EditorCanvas />, { wrapper });

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas!.width).toBe(CANVAS_WIDTH);
    expect(canvas!.height).toBe(CANVAS_HEIGHT);
  });
});
