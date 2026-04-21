import { nanoid } from "nanoid";
import type { EditorState, EditorAction, TextBlock, ImageBlock } from "./types";
import {
  TEXT_BLOCK_DEFAULTS,
  IMAGE_BLOCK_DEFAULTS,
  MIN_BLOCK_SIZE,
} from "./constants";

/**
 * Pushes the current blocks array onto history.past and clears history.future.
 * Call this before applying any mutating action so the pre-action state is saved
 * and any redo stack is discarded (Req 9.5, 9.6).
 */
export function withSnapshot(state: EditorState): EditorState {
  return {
    ...state,
    history: {
      past: [...state.history.past, state.blocks],
      future: [],
    },
  };
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "ADD_TEXT_BLOCK": {
      const snapped = withSnapshot(state);
      const nextLayerIndex =
        Math.max(...snapped.blocks.map((b) => b.layerIndex), -1) + 1;
      const textBlockCount = snapped.blocks.filter(
        (b) => b.type === "text",
      ).length;
      const newBlock: TextBlock = {
        ...TEXT_BLOCK_DEFAULTS,
        id: nanoid(),
        layerIndex: nextLayerIndex,
        name: `Text ${textBlockCount + 1}`,
      };
      return {
        ...snapped,
        blocks: [...snapped.blocks, newBlock],
      };
    }
    case "ADD_IMAGE_BLOCK": {
      const snapped = withSnapshot(state);
      const nextLayerIndex =
        Math.max(...snapped.blocks.map((b) => b.layerIndex), -1) + 1;
      const imageBlockCount = snapped.blocks.filter(
        (b) => b.type === "image",
      ).length;
      const newBlock: ImageBlock = {
        ...IMAGE_BLOCK_DEFAULTS,
        id: nanoid(),
        layerIndex: nextLayerIndex,
        name: `Image ${imageBlockCount + 1}`,
        imageSrc: action.payload.imageSrc,
      };
      return {
        ...snapped,
        blocks: [...snapped.blocks, newBlock],
      };
    }
    case "UPDATE_BLOCK": {
      const { id, changes } = action.payload;
      const blockExists = state.blocks.some((b) => b.id === id);
      if (!blockExists) return state;

      const snapped = withSnapshot(state);
      const updatedBlocks = snapped.blocks.map((block) => {
        if (block.id !== id) return block;
        // Spread changes but exclude type to preserve the discriminant union
        const { type: _type, ...safeChanges } = changes;
        const updated = { ...block, ...safeChanges };
        // Enforce minimum block size constraint (Req 6.3)
        if (updated.width < MIN_BLOCK_SIZE) {
          updated.width = MIN_BLOCK_SIZE;
        }
        if (updated.height < MIN_BLOCK_SIZE) {
          updated.height = MIN_BLOCK_SIZE;
        }
        return updated;
      });
      return { ...snapped, blocks: updatedBlocks };
    }
    case "SELECT_BLOCK": {
      const { id } = action.payload;
      // If id is null, clear selection. If id doesn't match any block, fall back to null.
      if (id === null) {
        return { ...state, selectedBlockId: null };
      }
      const exists = state.blocks.some((b) => b.id === id);
      return { ...state, selectedBlockId: exists ? id : null };
    }
    case "MOVE_LAYER_UP": {
      const { id } = action.payload;
      const block = state.blocks.find((b) => b.id === id);
      if (!block) return state;

      // Find the block with the next higher layerIndex
      const above = state.blocks
        .filter((b) => b.layerIndex > block.layerIndex)
        .sort((a, b) => a.layerIndex - b.layerIndex)[0];

      // No-op at top boundary
      if (!above) return state;

      const snapped = withSnapshot(state);
      const updatedBlocks = snapped.blocks.map((b) => {
        if (b.id === id) return { ...b, layerIndex: above.layerIndex };
        if (b.id === above.id) return { ...b, layerIndex: block.layerIndex };
        return b;
      });
      return { ...snapped, blocks: updatedBlocks };
    }
    case "MOVE_LAYER_DOWN": {
      const { id } = action.payload;
      const block = state.blocks.find((b) => b.id === id);
      if (!block) return state;

      // Find the block with the next lower layerIndex
      const below = state.blocks
        .filter((b) => b.layerIndex < block.layerIndex)
        .sort((a, b) => b.layerIndex - a.layerIndex)[0];

      // No-op at bottom boundary
      if (!below) return state;

      const snapped = withSnapshot(state);
      const updatedBlocks = snapped.blocks.map((b) => {
        if (b.id === id) return { ...b, layerIndex: below.layerIndex };
        if (b.id === below.id) return { ...b, layerIndex: block.layerIndex };
        return b;
      });
      return { ...snapped, blocks: updatedBlocks };
    }
    case "TOGGLE_VISIBILITY": {
      const { id } = action.payload;
      const block = state.blocks.find((b) => b.id === id);
      if (!block) return state;

      const snapped = withSnapshot(state);
      const updatedBlocks = snapped.blocks.map((b) =>
        b.id === id ? { ...b, visible: !b.visible } : b,
      );
      return { ...snapped, blocks: updatedBlocks };
    }
    case "UPDATE_TEXT_CONTENT": {
      const { id, text } = action.payload;
      const block = state.blocks.find((b) => b.id === id);
      if (!block || block.type !== "text") return state;

      const snapped = withSnapshot(state);
      const updatedBlocks = snapped.blocks.map((b) =>
        b.id === id && b.type === "text" ? { ...b, text } : b,
      );
      return { ...snapped, blocks: updatedBlocks };
    }
    case "SET_EDITING_TEXT": {
      return { ...state, isEditingText: action.payload.editing };
    }
    case "UNDO": {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      return {
        ...state,
        blocks: previous,
        history: {
          past: state.history.past.slice(0, -1),
          future: [state.blocks, ...state.history.future],
        },
      };
    }
    case "REDO": {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      return {
        ...state,
        blocks: next,
        history: {
          past: [...state.history.past, state.blocks],
          future: state.history.future.slice(1),
        },
      };
    }
    default:
      return state;
  }
}
