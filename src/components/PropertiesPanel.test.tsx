import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { PropertiesPanel } from "./PropertiesPanel";
import { EditorContext } from "../context/EditorContext";
import type { EditorContextValue } from "../context/EditorContext";
import { initialState } from "../constants";
import type { EditorState, TextBlock, ImageBlock } from "../types";

function createWrapper(overrides?: Partial<EditorContextValue>) {
  const dispatch = vi.fn();
  const stageRef = { current: null };
  const value: EditorContextValue = {
    state: initialState,
    dispatch,
    stageRef,
    ...overrides,
  };
  return {
    dispatch,
    value,
    wrapper: ({ children }: { children: ReactNode }) => (
      <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
    ),
  };
}

function makeTextBlock(overrides: Partial<TextBlock> = {}): TextBlock {
  return {
    id: "text-1",
    type: "text",
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    rotation: 0,
    layerIndex: 0,
    visible: true,
    name: "Text 1",
    text: "Hello",
    fontSize: 24,
    fontFamily: "Arial",
    fill: "#333333",
    ...overrides,
  };
}

function makeImageBlock(overrides: Partial<ImageBlock> = {}): ImageBlock {
  return {
    id: "image-1",
    type: "image",
    x: 200,
    y: 200,
    width: 200,
    height: 200,
    rotation: 0,
    layerIndex: 1,
    visible: true,
    name: "Image 1",
    imageSrc: "data:image/png;base64,abc",
    ...overrides,
  };
}

describe("PropertiesPanel", () => {
  // Requirement 1.2: Empty state message when no block selected
  it("shows empty state message when no block is selected", () => {
    const { wrapper } = createWrapper();

    render(<PropertiesPanel />, { wrapper });

    expect(
      screen.getByText("Select a block to edit its properties"),
    ).toBeInTheDocument();
  });

  // Requirement 3.1: Text block shows text-specific controls
  it("shows text-specific controls when a TextBlock is selected", () => {
    const block = makeTextBlock();
    const state: EditorState = {
      ...initialState,
      blocks: [block],
      selectedBlockId: block.id,
    };
    const { wrapper } = createWrapper({ state });

    render(<PropertiesPanel />, { wrapper });

    // Block heading
    expect(screen.getByText("Text 1")).toBeInTheDocument();

    // Text content textarea
    expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();

    // Font size input (label "Size" under the "Font" group)
    const fontGroup = screen.getByText("Font").closest(".properties-group")!;
    expect(fontGroup.querySelector('input[type="number"]')).toBeInTheDocument();

    // Font family dropdown
    expect(screen.getByText("Family")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Arial")).toBeInTheDocument();

    // Fill color input
    expect(screen.getByText("Color")).toBeInTheDocument();
  });

  // Requirement 4.1, 4.2: Image block shows thumbnail, hides text controls
  it("shows image thumbnail and hides text controls when an ImageBlock is selected", () => {
    const block = makeImageBlock();
    const state: EditorState = {
      ...initialState,
      blocks: [block],
      selectedBlockId: block.id,
    };
    const { wrapper } = createWrapper({ state });

    render(<PropertiesPanel />, { wrapper });

    // Block heading
    expect(screen.getByText("Image 1")).toBeInTheDocument();

    // Image thumbnail is present
    const thumbnail = screen.getByAltText("Image preview");
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute("src", "data:image/png;base64,abc");

    // Text-specific controls should NOT be present
    expect(screen.queryByText("Text")).not.toBeInTheDocument();
    expect(screen.queryByText("Font")).not.toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Family")).not.toBeInTheDocument();
  });

  // Requirement 3.6: Font family dropdown has all 6 options
  it("font family dropdown contains all 6 font options", () => {
    const block = makeTextBlock();
    const state: EditorState = {
      ...initialState,
      blocks: [block],
      selectedBlockId: block.id,
    };
    const { wrapper } = createWrapper({ state });

    render(<PropertiesPanel />, { wrapper });

    const select = screen.getByDisplayValue("Arial") as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.textContent);

    expect(options).toEqual([
      "Arial",
      "Helvetica",
      "Times New Roman",
      "Georgia",
      "Courier New",
      "Verdana",
    ]);
  });
});
