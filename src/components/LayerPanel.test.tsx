import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { LayerPanel } from "./LayerPanel";
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

describe("LayerPanel", () => {
  // Requirement 8.1: Displays blocks ordered by layerIndex descending
  it("displays blocks ordered by layerIndex descending (topmost first)", () => {
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
      makeTextBlock({ id: "t2", name: "Text 2", layerIndex: 2 }),
    ];
    const state: EditorState = {
      ...initialState,
      blocks,
    };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    // Topmost (highest layerIndex) should be first
    expect(items[0]).toHaveTextContent("Text 2");
    expect(items[1]).toHaveTextContent("Image 1");
    expect(items[2]).toHaveTextContent("Text 1");
  });

  // Requirement 8.1: Shows "No layers yet" when empty
  it('shows "No layers yet" when there are no blocks', () => {
    const { wrapper } = createWrapper();

    render(<LayerPanel />, { wrapper });

    expect(screen.getByText("No layers yet")).toBeInTheDocument();
  });

  // Requirement 8.7: Move Up disabled at top boundary
  it("disables Move Up button for the block at the top of the layer stack", () => {
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
    ];
    const state: EditorState = { ...initialState, blocks };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    // Image 1 is at the top (layerIndex 1)
    const moveUpButtons = screen.getAllByTitle("Move up");
    // First item in the list is the topmost block (Image 1)
    expect(moveUpButtons[0]).toBeDisabled();
  });

  // Requirement 8.8: Move Down disabled at bottom boundary
  it("disables Move Down button for the block at the bottom of the layer stack", () => {
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
    ];
    const state: EditorState = { ...initialState, blocks };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    // Text 1 is at the bottom (layerIndex 0)
    const moveDownButtons = screen.getAllByTitle("Move down");
    // Last item in the list is the bottom block (Text 1)
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });

  // Requirement 8.7, 8.8: Non-boundary blocks have enabled move buttons
  it("enables Move Up and Move Down for non-boundary blocks", () => {
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
      makeTextBlock({ id: "t2", name: "Text 2", layerIndex: 2 }),
    ];
    const state: EditorState = { ...initialState, blocks };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    // Image 1 is in the middle (layerIndex 1), second in the list
    const moveUpButtons = screen.getAllByTitle("Move up");
    const moveDownButtons = screen.getAllByTitle("Move down");

    // Middle item (index 1) should have both enabled
    expect(moveUpButtons[1]).toBeEnabled();
    expect(moveDownButtons[1]).toBeEnabled();
  });

  // Requirement 8.2: Move Up dispatches MOVE_LAYER_UP
  it("dispatches MOVE_LAYER_UP when Move Up is clicked", async () => {
    const user = userEvent.setup();
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
    ];
    const state: EditorState = { ...initialState, blocks };
    const { dispatch, wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    // Text 1 is at the bottom, its Move Up button should be enabled
    const moveUpButtons = screen.getAllByTitle("Move up");
    // Second item in the list is Text 1 (bottom block)
    await user.click(moveUpButtons[1]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "MOVE_LAYER_UP",
      payload: { id: "t1" },
    });
  });

  // Requirement 8.3: Move Down dispatches MOVE_LAYER_DOWN
  it("dispatches MOVE_LAYER_DOWN when Move Down is clicked", async () => {
    const user = userEvent.setup();
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
    ];
    const state: EditorState = { ...initialState, blocks };
    const { dispatch, wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    // Image 1 is at the top, its Move Down button should be enabled
    const moveDownButtons = screen.getAllByTitle("Move down");
    // First item in the list is Image 1 (top block)
    await user.click(moveDownButtons[0]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "MOVE_LAYER_DOWN",
      payload: { id: "i1" },
    });
  });

  // Requirement 8.4: Visibility toggle dispatches TOGGLE_VISIBILITY
  it("dispatches TOGGLE_VISIBILITY when visibility toggle is clicked", async () => {
    const user = userEvent.setup();
    const blocks = [makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 })];
    const state: EditorState = { ...initialState, blocks };
    const { dispatch, wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    const hideButton = screen.getByLabelText("Hide Text 1");
    await user.click(hideButton);

    expect(dispatch).toHaveBeenCalledWith({
      type: "TOGGLE_VISIBILITY",
      payload: { id: "t1" },
    });
  });

  // Requirement 8.4: Hidden block shows "Show" label
  it('shows "Show" label for hidden blocks', () => {
    const blocks = [
      makeTextBlock({
        id: "t1",
        name: "Text 1",
        layerIndex: 0,
        visible: false,
      }),
    ];
    const state: EditorState = { ...initialState, blocks };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    expect(screen.getByLabelText("Show Text 1")).toBeInTheDocument();
  });

  // Selection: Selected block has layer-item--selected class
  it("applies selected class to the selected block", () => {
    const blocks = [
      makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 }),
      makeImageBlock({ id: "i1", name: "Image 1", layerIndex: 1 }),
    ];
    const state: EditorState = {
      ...initialState,
      blocks,
      selectedBlockId: "t1",
    };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    const items = screen.getAllByRole("listitem");
    // Text 1 is the second item (lower layerIndex, listed last)
    const textItem = items[1];
    const imageItem = items[0];

    expect(textItem.className).toContain("layer-item--selected");
    expect(imageItem.className).not.toContain("layer-item--selected");
  });

  // Selection: Clicking a layer item dispatches SELECT_BLOCK
  it("dispatches SELECT_BLOCK when a layer item is clicked", async () => {
    const user = userEvent.setup();
    const blocks = [makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 })];
    const state: EditorState = { ...initialState, blocks };
    const { dispatch, wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    await user.click(screen.getByLabelText("Select Text 1"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "SELECT_BLOCK",
      payload: { id: "t1" },
    });
  });

  // Single block: both Move Up and Move Down are disabled
  it("disables both Move Up and Move Down for a single block", () => {
    const blocks = [makeTextBlock({ id: "t1", name: "Text 1", layerIndex: 0 })];
    const state: EditorState = { ...initialState, blocks };
    const { wrapper } = createWrapper({ state });

    render(<LayerPanel />, { wrapper });

    expect(screen.getByTitle("Move up")).toBeDisabled();
    expect(screen.getByTitle("Move down")).toBeDisabled();
  });
});
