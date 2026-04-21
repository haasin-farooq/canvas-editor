import { describe, it, expect } from "vitest";
import { editorReducer } from "./reducer";
import { initialState } from "./constants";
import type { EditorState, TextBlock, ImageBlock } from "./types";

/**
 * Helper: produce a state with one text block already added.
 */
function stateWithTextBlock(): EditorState {
  return editorReducer(initialState, { type: "ADD_TEXT_BLOCK" });
}

/**
 * Helper: produce a state with one image block already added.
 */
function stateWithImageBlock(): EditorState {
  return editorReducer(initialState, {
    type: "ADD_IMAGE_BLOCK",
    payload: { imageSrc: "data:image/png;base64,abc" },
  });
}

describe("UPDATE_BLOCK action", () => {
  it("updates position of an existing text block", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { x: 100, y: 200 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.x).toBe(100);
    expect(updated.y).toBe(200);
  });

  it("updates size of an existing block", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { width: 300, height: 150 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.width).toBe(300);
    expect(updated.height).toBe(150);
  });

  it("updates rotation of an existing block", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { rotation: 45 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.rotation).toBe(45);
  });

  it("enforces minimum width of 20px", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { width: 5 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.width).toBe(20);
  });

  it("enforces minimum height of 20px", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { height: 10 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.height).toBe(20);
  });

  it("enforces minimum size when both width and height are below threshold", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { width: 0, height: -5 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.width).toBe(20);
    expect(updated.height).toBe(20);
  });

  it("allows width and height exactly at minimum (20px)", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { width: 20, height: 20 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.width).toBe(20);
    expect(updated.height).toBe(20);
  });

  it("pushes a history snapshot before applying changes", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];
    const pastLengthBefore = state.history.past.length;

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { x: 50 } },
    });

    expect(next.history.past.length).toBe(pastLengthBefore + 1);
    // The last entry in past should be the pre-action blocks
    expect(next.history.past[next.history.past.length - 1]).toEqual(
      state.blocks,
    );
  });

  it("clears the redo stack (history.future) on update", () => {
    // Build a state with a non-empty future by adding a block then undoing
    let state = stateWithTextBlock();
    const block = state.blocks[0];

    // Add another block then undo to get a non-empty future
    state = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { x: 999 } },
    });
    // Simulate undo by manually setting future (since UNDO isn't implemented yet)
    state = {
      ...state,
      history: {
        past: state.history.past,
        future: [state.blocks],
      },
    };
    expect(state.history.future.length).toBeGreaterThan(0);

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { x: 50 } },
    });

    expect(next.history.future).toEqual([]);
  });

  it("returns state unchanged for a non-existent block id", () => {
    const state = stateWithTextBlock();

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: "non-existent-id", changes: { x: 100 } },
    });

    expect(next).toBe(state);
  });

  it("does not push a history snapshot for a non-existent block id", () => {
    const state = stateWithTextBlock();

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: "non-existent-id", changes: { x: 100 } },
    });

    expect(next.history.past.length).toBe(state.history.past.length);
  });

  it("preserves other blocks when updating one", () => {
    let state = stateWithTextBlock();
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    const [first, second] = state.blocks;

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: second.id, changes: { x: 999 } },
    });

    const firstAfter = next.blocks.find((b) => b.id === first.id)!;
    expect(firstAfter.x).toBe(first.x);
    expect(firstAfter.y).toBe(first.y);
  });

  it("works on image blocks too", () => {
    const state = stateWithImageBlock();
    const block = state.blocks[0] as ImageBlock;

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { x: 50, y: 75, width: 400 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id) as ImageBlock;
    expect(updated.x).toBe(50);
    expect(updated.y).toBe(75);
    expect(updated.width).toBe(400);
    expect(updated.type).toBe("image");
    expect(updated.imageSrc).toBe("data:image/png;base64,abc");
  });

  it("preserves block type discriminant after update", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0] as TextBlock;

    const next = editorReducer(state, {
      type: "UPDATE_BLOCK",
      payload: { id: block.id, changes: { x: 50 } },
    });

    const updated = next.blocks.find((b) => b.id === block.id) as TextBlock;
    expect(updated.type).toBe("text");
    expect(updated.text).toBe("Edit me");
    expect(updated.fontSize).toBe(24);
  });
});

describe("MOVE_LAYER_UP action", () => {
  function stateWithThreeBlocks(): EditorState {
    let state = initialState;
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    return state;
  }

  it("swaps layerIndex with the block above", () => {
    const state = stateWithThreeBlocks();
    // blocks have layerIndex 0, 1, 2
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;
    const middle = state.blocks.find((b) => b.layerIndex === 1)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: bottom.id },
    });

    const updatedBottom = next.blocks.find((b) => b.id === bottom.id)!;
    const updatedMiddle = next.blocks.find((b) => b.id === middle.id)!;
    expect(updatedBottom.layerIndex).toBe(1);
    expect(updatedMiddle.layerIndex).toBe(0);
  });

  it("is a no-op when the block is already at the top", () => {
    const state = stateWithThreeBlocks();
    const top = state.blocks.find((b) => b.layerIndex === 2)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: top.id },
    });

    expect(next).toBe(state);
  });

  it("does not change other blocks' layerIndices", () => {
    const state = stateWithThreeBlocks();
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;
    const top = state.blocks.find((b) => b.layerIndex === 2)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: bottom.id },
    });

    const updatedTop = next.blocks.find((b) => b.id === top.id)!;
    expect(updatedTop.layerIndex).toBe(2);
  });

  it("pushes a history snapshot", () => {
    const state = stateWithThreeBlocks();
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: bottom.id },
    });

    expect(next.history.past.length).toBe(state.history.past.length + 1);
    expect(next.history.past[next.history.past.length - 1]).toEqual(
      state.blocks,
    );
  });

  it("clears the redo stack", () => {
    let state = stateWithThreeBlocks();
    state = {
      ...state,
      history: { ...state.history, future: [state.blocks] },
    };
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: bottom.id },
    });

    expect(next.history.future).toEqual([]);
  });

  it("returns state unchanged for a non-existent block id", () => {
    const state = stateWithThreeBlocks();

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: "non-existent" },
    });

    expect(next).toBe(state);
  });

  it("preserves the set of layerIndex values after swap", () => {
    const state = stateWithThreeBlocks();
    const indicesBefore = state.blocks.map((b) => b.layerIndex).sort();
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_UP",
      payload: { id: bottom.id },
    });

    const indicesAfter = next.blocks.map((b) => b.layerIndex).sort();
    expect(indicesAfter).toEqual(indicesBefore);
  });
});

describe("MOVE_LAYER_DOWN action", () => {
  function stateWithThreeBlocks(): EditorState {
    let state = initialState;
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    return state;
  }

  it("swaps layerIndex with the block below", () => {
    const state = stateWithThreeBlocks();
    const top = state.blocks.find((b) => b.layerIndex === 2)!;
    const middle = state.blocks.find((b) => b.layerIndex === 1)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: top.id },
    });

    const updatedTop = next.blocks.find((b) => b.id === top.id)!;
    const updatedMiddle = next.blocks.find((b) => b.id === middle.id)!;
    expect(updatedTop.layerIndex).toBe(1);
    expect(updatedMiddle.layerIndex).toBe(2);
  });

  it("is a no-op when the block is already at the bottom", () => {
    const state = stateWithThreeBlocks();
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: bottom.id },
    });

    expect(next).toBe(state);
  });

  it("does not change other blocks' layerIndices", () => {
    const state = stateWithThreeBlocks();
    const top = state.blocks.find((b) => b.layerIndex === 2)!;
    const bottom = state.blocks.find((b) => b.layerIndex === 0)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: top.id },
    });

    const updatedBottom = next.blocks.find((b) => b.id === bottom.id)!;
    expect(updatedBottom.layerIndex).toBe(0);
  });

  it("pushes a history snapshot", () => {
    const state = stateWithThreeBlocks();
    const top = state.blocks.find((b) => b.layerIndex === 2)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: top.id },
    });

    expect(next.history.past.length).toBe(state.history.past.length + 1);
    expect(next.history.past[next.history.past.length - 1]).toEqual(
      state.blocks,
    );
  });

  it("clears the redo stack", () => {
    let state = stateWithThreeBlocks();
    state = {
      ...state,
      history: { ...state.history, future: [state.blocks] },
    };
    const top = state.blocks.find((b) => b.layerIndex === 2)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: top.id },
    });

    expect(next.history.future).toEqual([]);
  });

  it("returns state unchanged for a non-existent block id", () => {
    const state = stateWithThreeBlocks();

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: "non-existent" },
    });

    expect(next).toBe(state);
  });

  it("preserves the set of layerIndex values after swap", () => {
    const state = stateWithThreeBlocks();
    const indicesBefore = state.blocks.map((b) => b.layerIndex).sort();
    const top = state.blocks.find((b) => b.layerIndex === 2)!;

    const next = editorReducer(state, {
      type: "MOVE_LAYER_DOWN",
      payload: { id: top.id },
    });

    const indicesAfter = next.blocks.map((b) => b.layerIndex).sort();
    expect(indicesAfter).toEqual(indicesBefore);
  });
});

describe("UPDATE_TEXT_CONTENT action", () => {
  it("updates the text property of a text block", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0] as TextBlock;

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: block.id, text: "New copy" },
    });

    const updated = next.blocks.find((b) => b.id === block.id) as TextBlock;
    expect(updated.text).toBe("New copy");
  });

  it("preserves other text block properties", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0] as TextBlock;

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: block.id, text: "Updated" },
    });

    const updated = next.blocks.find((b) => b.id === block.id) as TextBlock;
    expect(updated.type).toBe("text");
    expect(updated.fontSize).toBe(block.fontSize);
    expect(updated.fontFamily).toBe(block.fontFamily);
    expect(updated.fill).toBe(block.fill);
    expect(updated.x).toBe(block.x);
    expect(updated.y).toBe(block.y);
  });

  it("pushes a history snapshot", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];
    const pastLengthBefore = state.history.past.length;

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: block.id, text: "Changed" },
    });

    expect(next.history.past.length).toBe(pastLengthBefore + 1);
    expect(next.history.past[next.history.past.length - 1]).toEqual(
      state.blocks,
    );
  });

  it("clears the redo stack", () => {
    let state = stateWithTextBlock();
    const block = state.blocks[0];
    state = {
      ...state,
      history: { ...state.history, future: [state.blocks] },
    };
    expect(state.history.future.length).toBeGreaterThan(0);

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: block.id, text: "Changed" },
    });

    expect(next.history.future).toEqual([]);
  });

  it("returns state unchanged for a non-existent block id", () => {
    const state = stateWithTextBlock();

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: "non-existent", text: "Nope" },
    });

    expect(next).toBe(state);
  });

  it("returns state unchanged when targeting an image block", () => {
    const state = stateWithImageBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: block.id, text: "Should not apply" },
    });

    expect(next).toBe(state);
  });

  it("does not affect other blocks", () => {
    let state = stateWithTextBlock();
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    const [first, second] = state.blocks;

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: second.id, text: "Only second" },
    });

    const firstAfter = next.blocks.find((b) => b.id === first.id) as TextBlock;
    expect(firstAfter.text).toBe("Edit me");
    const secondAfter = next.blocks.find(
      (b) => b.id === second.id,
    ) as TextBlock;
    expect(secondAfter.text).toBe("Only second");
  });

  it("handles empty string text", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];

    const next = editorReducer(state, {
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: block.id, text: "" },
    });

    const updated = next.blocks.find((b) => b.id === block.id) as TextBlock;
    expect(updated.text).toBe("");
  });
});

describe("TOGGLE_VISIBILITY action", () => {
  it("flips visible from true to false", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];
    expect(block.visible).toBe(true);

    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: block.id },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.visible).toBe(false);
  });

  it("flips visible from false to true", () => {
    // First toggle to false
    let state = stateWithTextBlock();
    const block = state.blocks[0];
    state = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: block.id },
    });
    expect(state.blocks.find((b) => b.id === block.id)!.visible).toBe(false);

    // Toggle back to true
    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: block.id },
    });

    const updated = next.blocks.find((b) => b.id === block.id)!;
    expect(updated.visible).toBe(true);
  });

  it("pushes a history snapshot", () => {
    const state = stateWithTextBlock();
    const block = state.blocks[0];
    const pastLengthBefore = state.history.past.length;

    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: block.id },
    });

    expect(next.history.past.length).toBe(pastLengthBefore + 1);
    expect(next.history.past[next.history.past.length - 1]).toEqual(
      state.blocks,
    );
  });

  it("clears the redo stack", () => {
    let state = stateWithTextBlock();
    const block = state.blocks[0];
    state = {
      ...state,
      history: { ...state.history, future: [state.blocks] },
    };
    expect(state.history.future.length).toBeGreaterThan(0);

    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: block.id },
    });

    expect(next.history.future).toEqual([]);
  });

  it("returns state unchanged for a non-existent block id", () => {
    const state = stateWithTextBlock();

    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: "non-existent" },
    });

    expect(next).toBe(state);
  });

  it("does not affect other blocks", () => {
    let state = stateWithTextBlock();
    state = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
    const [first, second] = state.blocks;

    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: second.id },
    });

    const firstAfter = next.blocks.find((b) => b.id === first.id)!;
    expect(firstAfter.visible).toBe(true);
    const secondAfter = next.blocks.find((b) => b.id === second.id)!;
    expect(secondAfter.visible).toBe(false);
  });

  it("works on image blocks", () => {
    const state = stateWithImageBlock();
    const block = state.blocks[0] as ImageBlock;

    const next = editorReducer(state, {
      type: "TOGGLE_VISIBILITY",
      payload: { id: block.id },
    });

    const updated = next.blocks.find((b) => b.id === block.id) as ImageBlock;
    expect(updated.visible).toBe(false);
    expect(updated.type).toBe("image");
    expect(updated.imageSrc).toBe("data:image/png;base64,abc");
  });
});
