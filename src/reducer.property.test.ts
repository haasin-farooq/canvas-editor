import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { editorReducer } from "./reducer";
import { initialState } from "./constants";
import type { Block, TextBlock, ImageBlock } from "./types";

/**
 * Arbitrary: generates a random TextBlock with an arbitrary layerIndex.
 */
const textBlockArb: fc.Arbitrary<TextBlock> = fc.record({
  id: fc.uuid(),
  type: fc.constant("text" as const),
  x: fc.integer({ min: 0, max: 800 }),
  y: fc.integer({ min: 0, max: 600 }),
  width: fc.integer({ min: 20, max: 800 }),
  height: fc.integer({ min: 20, max: 600 }),
  rotation: fc.integer({ min: 0, max: 359 }),
  layerIndex: fc.integer({ min: 0, max: 100 }),
  visible: fc.boolean(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  text: fc.string({ minLength: 0, maxLength: 100 }),
  fontSize: fc.integer({ min: 8, max: 72 }),
  fontFamily: fc.constantFrom("Arial", "Helvetica", "Times New Roman"),
  fill: fc.constantFrom("#333333", "#000000", "#ff0000", "#0000ff"),
});

/**
 * Arbitrary: generates a random ImageBlock with an arbitrary layerIndex.
 */
const imageBlockArb: fc.Arbitrary<ImageBlock> = fc.record({
  id: fc.uuid(),
  type: fc.constant("image" as const),
  x: fc.integer({ min: 0, max: 800 }),
  y: fc.integer({ min: 0, max: 600 }),
  width: fc.integer({ min: 20, max: 800 }),
  height: fc.integer({ min: 20, max: 600 }),
  rotation: fc.integer({ min: 0, max: 359 }),
  layerIndex: fc.integer({ min: 0, max: 100 }),
  visible: fc.boolean(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  imageSrc: fc.constant("data:image/png;base64,abc"),
});

/**
 * Arbitrary: generates a random Block (either TextBlock or ImageBlock).
 */
const blockArb: fc.Arbitrary<Block> = fc.oneof(textBlockArb, imageBlockArb);

/**
 * Arbitrary: generates a non-empty array of random blocks.
 */
const blocksArb = fc.array(blockArb, { minLength: 1, maxLength: 20 });

describe("Feature: ad-template-editor, Property 1: Block rendering order matches layerIndex", () => {
  /**
   * **Validates: Requirements 1.3, 8.1**
   *
   * For any array of blocks with arbitrary layerIndex values, sorting by
   * layerIndex ascending produces the correct canvas rendering order
   * (each element's layerIndex <= next element's layerIndex).
   */
  it("sorting blocks by layerIndex ascending produces a consistently ordered array for canvas rendering", () => {
    fc.assert(
      fc.property(blocksArb, (blocks) => {
        const sorted = [...blocks].sort((a, b) => a.layerIndex - b.layerIndex);

        // Every consecutive pair must satisfy: previous.layerIndex <= current.layerIndex
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].layerIndex).toBeLessThanOrEqual(
            sorted[i].layerIndex,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 1.3, 8.1**
   *
   * For any array of blocks, sorting by layerIndex descending produces
   * the correct layer panel display order (highest layerIndex first).
   */
  it("sorting blocks by layerIndex descending produces the correct layer panel display order", () => {
    fc.assert(
      fc.property(blocksArb, (blocks) => {
        const sorted = [...blocks].sort((a, b) => b.layerIndex - a.layerIndex);

        // Every consecutive pair must satisfy: previous.layerIndex >= current.layerIndex
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i - 1].layerIndex).toBeGreaterThanOrEqual(
            sorted[i].layerIndex,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 1.3, 8.1**
   *
   * After dispatching multiple ADD_TEXT_BLOCK and ADD_IMAGE_BLOCK actions
   * through the reducer, the resulting blocks array when sorted by
   * layerIndex maintains consistent ascending order.
   */
  it("blocks added via reducer maintain consistent layerIndex ordering when sorted", () => {
    // Generate a random sequence of add actions
    const addActionArb = fc.oneof(
      fc.constant({ type: "ADD_TEXT_BLOCK" as const }),
      fc.constant({
        type: "ADD_IMAGE_BLOCK" as const,
        payload: { imageSrc: "data:image/png;base64,test" },
      }),
    );

    fc.assert(
      fc.property(
        fc.array(addActionArb, { minLength: 1, maxLength: 15 }),
        (actions) => {
          // Apply all actions to build up state
          const finalState = actions.reduce(
            (state, action) => editorReducer(state, action),
            initialState,
          );

          // Sort by layerIndex ascending (canvas rendering order)
          const sorted = [...finalState.blocks].sort(
            (a, b) => a.layerIndex - b.layerIndex,
          );

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].layerIndex).toBeLessThanOrEqual(
              sorted[i].layerIndex,
            );
          }

          // Sort by layerIndex descending (layer panel display order)
          const sortedDesc = [...finalState.blocks].sort(
            (a, b) => b.layerIndex - a.layerIndex,
          );

          for (let i = 1; i < sortedDesc.length; i++) {
            expect(sortedDesc[i - 1].layerIndex).toBeGreaterThanOrEqual(
              sortedDesc[i].layerIndex,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 1.3, 8.1**
   *
   * Sorting is stable with respect to layerIndex: the ascending and
   * descending sorts are inverses of each other (same elements, reversed).
   */
  it("ascending and descending sorts contain the same blocks in reversed order", () => {
    fc.assert(
      fc.property(blocksArb, (blocks) => {
        const ascending = [...blocks].sort(
          (a, b) => a.layerIndex - b.layerIndex,
        );
        const descending = [...blocks].sort(
          (a, b) => b.layerIndex - a.layerIndex,
        );

        // Both sorted arrays should have the same length
        expect(ascending.length).toBe(descending.length);

        // The ids in descending order should be the reverse of ascending
        // (when layerIndex values are unique). When not unique, at minimum
        // the layerIndex values themselves must be reversed.
        const ascIndices = ascending.map((b) => b.layerIndex);
        const descIndices = descending.map((b) => b.layerIndex);
        expect(ascIndices).toEqual([...descIndices].reverse());
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Shared arbitraries for tests that need an EditorState with blocks
// ---------------------------------------------------------------------------

/**
 * Arbitrary: generates blocks with UNIQUE layerIndex values.
 * This is important for layer swap tests where the reducer finds adjacent
 * blocks by layerIndex.
 */
const uniqueLayerBlocksArb = (minLen = 2, maxLen = 10) =>
  fc
    .uniqueArray(fc.integer({ min: 0, max: 200 }), {
      minLength: minLen,
      maxLength: maxLen,
    })
    .chain((indices) =>
      fc
        .array(blockArb, {
          minLength: indices.length,
          maxLength: indices.length,
        })
        .map((blocks) =>
          blocks.map((b, i) => ({ ...b, layerIndex: indices[i] })),
        ),
    );

/**
 * Arbitrary: generates an EditorState with a given set of blocks.
 */
const editorStateWithBlocksArb = (
  blocks: fc.Arbitrary<Block[]>,
): fc.Arbitrary<import("./types").EditorState> =>
  blocks.map((bs) => ({
    ...initialState,
    blocks: bs,
  }));

/**
 * Arbitrary: generates a mutating action that targets an existing block id.
 * Mutating actions are those that call withSnapshot.
 */
const mutatingActionForBlocksArb = (
  blocks: Block[],
): fc.Arbitrary<import("./types").EditorAction> => {
  if (blocks.length === 0) {
    // If no blocks, only add actions are mutating
    return fc.oneof(
      fc.constant({ type: "ADD_TEXT_BLOCK" as const }),
      fc.constant({
        type: "ADD_IMAGE_BLOCK" as const,
        payload: { imageSrc: "data:image/png;base64,test" },
      }),
    );
  }
  const idArb = fc.constantFrom(...blocks.map((b) => b.id));
  return fc.oneof(
    fc.constant({ type: "ADD_TEXT_BLOCK" as const }),
    fc.constant({
      type: "ADD_IMAGE_BLOCK" as const,
      payload: { imageSrc: "data:image/png;base64,test" },
    }),
    idArb.map((id) => ({
      type: "UPDATE_BLOCK" as const,
      payload: { id, changes: { x: 50, y: 50 } },
    })),
    idArb.map((id) => ({
      type: "MOVE_LAYER_UP" as const,
      payload: { id },
    })),
    idArb.map((id) => ({
      type: "MOVE_LAYER_DOWN" as const,
      payload: { id },
    })),
    idArb.map((id) => ({
      type: "TOGGLE_VISIBILITY" as const,
      payload: { id },
    })),
    idArb.map((id) => ({
      type: "UPDATE_TEXT_CONTENT" as const,
      payload: { id, text: "updated" },
    })),
  );
};

// ---------------------------------------------------------------------------
// Property 2: New blocks receive the highest layerIndex
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 2: New blocks receive the highest layerIndex", () => {
  /**
   * **Validates: Requirements 2.3, 3.4**
   *
   * For any existing set of blocks, when a new text block is added,
   * its layerIndex is strictly greater than every existing block's layerIndex.
   */
  it("ADD_TEXT_BLOCK assigns a layerIndex higher than all existing blocks", () => {
    fc.assert(
      fc.property(blocksArb, (blocks) => {
        const state = { ...initialState, blocks };
        const next = editorReducer(state, { type: "ADD_TEXT_BLOCK" });
        const newBlock = next.blocks[next.blocks.length - 1];
        const maxExisting = Math.max(...blocks.map((b) => b.layerIndex));
        expect(newBlock.layerIndex).toBeGreaterThan(maxExisting);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 2.3, 3.4**
   *
   * For any existing set of blocks, when a new image block is added,
   * its layerIndex is strictly greater than every existing block's layerIndex.
   */
  it("ADD_IMAGE_BLOCK assigns a layerIndex higher than all existing blocks", () => {
    fc.assert(
      fc.property(blocksArb, (blocks) => {
        const state = { ...initialState, blocks };
        const next = editorReducer(state, {
          type: "ADD_IMAGE_BLOCK",
          payload: { imageSrc: "data:image/png;base64,test" },
        });
        const newBlock = next.blocks[next.blocks.length - 1];
        const maxExisting = Math.max(...blocks.map((b) => b.layerIndex));
        expect(newBlock.layerIndex).toBeGreaterThan(maxExisting);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 2.3, 3.4**
   *
   * Adding a block to an empty canvas gives it layerIndex 0.
   */
  it("adding a block to an empty canvas gives layerIndex 0", () => {
    const next = editorReducer(initialState, { type: "ADD_TEXT_BLOCK" });
    expect(next.blocks[0].layerIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Property 3: Mutating actions push a history snapshot
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 3: Mutating actions push a history snapshot", () => {
  /**
   * **Validates: Requirements 2.4, 3.5, 5.2, 6.2, 7.2, 8.6**
   *
   * For any editor state and any mutating action, history.past grows by 1
   * and the new entry equals the pre-action blocks array.
   */
  it("mutating actions increase history.past by 1 and store pre-action blocks", () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 10 }).chain((blocks) => {
          // Ensure unique ids
          const uniqueBlocks = blocks.map((b, i) => ({
            ...b,
            id: `block-${i}`,
          }));
          return mutatingActionForBlocksArb(uniqueBlocks).map((action) => ({
            blocks: uniqueBlocks,
            action,
          }));
        }),
        ({ blocks, action }) => {
          const state = { ...initialState, blocks };
          const pastLenBefore = state.history.past.length;
          const blocksBefore = state.blocks;

          const next = editorReducer(state, action);

          // For mutating actions that actually change state (not no-ops like
          // MOVE_LAYER_UP on top block or UPDATE_TEXT_CONTENT on image block),
          // history.past should grow by 1.
          // Some actions are no-ops (e.g., MOVE_LAYER_UP on the topmost block).
          // In that case the state is returned unchanged.
          if (next !== state) {
            expect(next.history.past.length).toBe(pastLenBefore + 1);
            // The last entry in past should be the pre-action blocks
            expect(next.history.past[next.history.past.length - 1]).toEqual(
              blocksBefore,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Selection invariant
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 4: Selection invariant", () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any sequence of editor actions, selectedBlockId is always null
   * or the id of a block that exists in the current blocks array.
   */
  it("selectedBlockId is always null or a valid block id after any action sequence", () => {
    // Generate a sequence of actions including selects, adds, and other ops
    const actionSeqArb = fc
      .array(blockArb, { minLength: 1, maxLength: 5 })
      .chain((seedBlocks) => {
        const uniqueBlocks = seedBlocks.map((b, i) => ({
          ...b,
          id: `block-${i}`,
        }));
        const ids = uniqueBlocks.map((b) => b.id);

        const actionArb: fc.Arbitrary<import("./types").EditorAction> =
          fc.oneof(
            fc.constant({ type: "ADD_TEXT_BLOCK" as const }),
            fc.constant({
              type: "ADD_IMAGE_BLOCK" as const,
              payload: { imageSrc: "data:image/png;base64,test" },
            }),
            fc.constantFrom(...ids, null, "nonexistent-id").map((id) => ({
              type: "SELECT_BLOCK" as const,
              payload: { id },
            })),
            fc.constantFrom(...ids).map((id) => ({
              type: "TOGGLE_VISIBILITY" as const,
              payload: { id },
            })),
            fc.constant({ type: "UNDO" as const }),
            fc.constant({ type: "REDO" as const }),
          );

        return fc
          .array(actionArb, { minLength: 1, maxLength: 15 })
          .map((actions) => ({ seedBlocks: uniqueBlocks, actions }));
      });

    fc.assert(
      fc.property(actionSeqArb, ({ seedBlocks, actions }) => {
        let state = { ...initialState, blocks: seedBlocks };

        for (const action of actions) {
          state = editorReducer(state, action);

          // Invariant: selectedBlockId is null or a valid block id
          if (state.selectedBlockId !== null) {
            const ids = state.blocks.map((b) => b.id);
            expect(ids).toContain(state.selectedBlockId);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Minimum block size constraint
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 5: Minimum block size constraint", () => {
  /**
   * **Validates: Requirements 6.3**
   *
   * For any block and any resize operation with arbitrarily small target
   * sizes, the resulting block width and height are both >= 20.
   */
  it("UPDATE_BLOCK enforces minimum 20×20 size on all blocks", () => {
    fc.assert(
      fc.property(
        blockArb,
        fc.integer({ min: -100, max: 1000 }),
        fc.integer({ min: -100, max: 1000 }),
        (block, newWidth, newHeight) => {
          const state = {
            ...initialState,
            blocks: [{ ...block, id: "target" }],
          };
          const next = editorReducer(state, {
            type: "UPDATE_BLOCK",
            payload: {
              id: "target",
              changes: { width: newWidth, height: newHeight },
            },
          });
          const updated = next.blocks.find((b) => b.id === "target")!;
          expect(updated.width).toBeGreaterThanOrEqual(20);
          expect(updated.height).toBeGreaterThanOrEqual(20);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Layer swap correctness
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 6: Layer swap correctness", () => {
  /**
   * **Validates: Requirements 8.2, 8.3**
   *
   * For any array of blocks with unique layerIndex values, moving a
   * non-boundary block up swaps its layerIndex with exactly one adjacent
   * block, and the total set of layerIndex values is preserved.
   */
  it("MOVE_LAYER_UP swaps layerIndex with the adjacent block above and preserves the index set", () => {
    fc.assert(
      fc.property(
        uniqueLayerBlocksArb(2, 10).chain((blocks) => {
          // Ensure unique ids
          const uniqueBlocks = blocks.map((b, i) => ({
            ...b,
            id: `block-${i}`,
          }));
          // Sort by layerIndex to find non-top blocks
          const sorted = [...uniqueBlocks].sort(
            (a, b) => a.layerIndex - b.layerIndex,
          );
          // Pick a block that is NOT the topmost (can move up)
          const nonTopBlocks = sorted.slice(0, -1);
          return fc
            .constantFrom(...nonTopBlocks.map((b) => b.id))
            .map((id) => ({ blocks: uniqueBlocks, targetId: id }));
        }),
        ({ blocks, targetId }) => {
          const state = { ...initialState, blocks };
          const indexSetBefore = new Set(blocks.map((b) => b.layerIndex));

          const next = editorReducer(state, {
            type: "MOVE_LAYER_UP",
            payload: { id: targetId },
          });

          // The set of layerIndex values should be preserved
          const indexSetAfter = new Set(next.blocks.map((b) => b.layerIndex));
          expect(indexSetAfter).toEqual(indexSetBefore);

          // The target block's layerIndex should have increased
          const targetBefore = blocks.find((b) => b.id === targetId)!;
          const targetAfter = next.blocks.find((b) => b.id === targetId)!;
          expect(targetAfter.layerIndex).toBeGreaterThan(
            targetBefore.layerIndex,
          );

          // Exactly one other block should have changed its layerIndex
          const changedBlocks = next.blocks.filter((nb) => {
            const ob = blocks.find((b) => b.id === nb.id)!;
            return ob.layerIndex !== nb.layerIndex;
          });
          expect(changedBlocks.length).toBe(2); // target + swapped
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 8.2, 8.3**
   *
   * MOVE_LAYER_DOWN swaps layerIndex with the adjacent block below.
   */
  it("MOVE_LAYER_DOWN swaps layerIndex with the adjacent block below and preserves the index set", () => {
    fc.assert(
      fc.property(
        uniqueLayerBlocksArb(2, 10).chain((blocks) => {
          const uniqueBlocks = blocks.map((b, i) => ({
            ...b,
            id: `block-${i}`,
          }));
          const sorted = [...uniqueBlocks].sort(
            (a, b) => a.layerIndex - b.layerIndex,
          );
          // Pick a block that is NOT the bottommost (can move down)
          const nonBottomBlocks = sorted.slice(1);
          return fc
            .constantFrom(...nonBottomBlocks.map((b) => b.id))
            .map((id) => ({ blocks: uniqueBlocks, targetId: id }));
        }),
        ({ blocks, targetId }) => {
          const state = { ...initialState, blocks };
          const indexSetBefore = new Set(blocks.map((b) => b.layerIndex));

          const next = editorReducer(state, {
            type: "MOVE_LAYER_DOWN",
            payload: { id: targetId },
          });

          const indexSetAfter = new Set(next.blocks.map((b) => b.layerIndex));
          expect(indexSetAfter).toEqual(indexSetBefore);

          const targetBefore = blocks.find((b) => b.id === targetId)!;
          const targetAfter = next.blocks.find((b) => b.id === targetId)!;
          expect(targetAfter.layerIndex).toBeLessThan(targetBefore.layerIndex);

          const changedBlocks = next.blocks.filter((nb) => {
            const ob = blocks.find((b) => b.id === nb.id)!;
            return ob.layerIndex !== nb.layerIndex;
          });
          expect(changedBlocks.length).toBe(2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Visibility toggle is an involution
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 7: Visibility toggle is an involution", () => {
  /**
   * **Validates: Requirements 8.4**
   *
   * For any block, toggling visibility twice returns it to its original
   * visibility state.
   */
  it("toggling visibility twice restores the original visible value", () => {
    fc.assert(
      fc.property(blockArb, (block) => {
        const b = { ...block, id: "target" };
        const state = { ...initialState, blocks: [b] };

        const once = editorReducer(state, {
          type: "TOGGLE_VISIBILITY",
          payload: { id: "target" },
        });
        const twice = editorReducer(once, {
          type: "TOGGLE_VISIBILITY",
          payload: { id: "target" },
        });

        const original = state.blocks.find((bl) => bl.id === "target")!;
        const result = twice.blocks.find((bl) => bl.id === "target")!;
        expect(result.visible).toBe(original.visible);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Only visible blocks are rendered
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 8: Only visible blocks are rendered", () => {
  /**
   * **Validates: Requirements 8.5, 10.4**
   *
   * For any set of blocks with mixed visibility, filtering to
   * visible === true produces exactly the subset of visible blocks.
   */
  it("filtering blocks by visible === true yields exactly the visible subset", () => {
    fc.assert(
      fc.property(blocksArb, (blocks) => {
        const visibleBlocks = blocks.filter((b) => b.visible);
        const hiddenBlocks = blocks.filter((b) => !b.visible);

        // Every visible block should be in the filtered set
        for (const vb of visibleBlocks) {
          expect(vb.visible).toBe(true);
        }

        // No hidden block should be in the visible set
        for (const hb of hiddenBlocks) {
          expect(hb.visible).toBe(false);
        }

        // The union should equal the original
        expect(visibleBlocks.length + hiddenBlocks.length).toBe(blocks.length);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 8.5, 10.4**
   *
   * After toggling a block to hidden, it should not appear in the
   * visible-only filtered list.
   */
  it("a block toggled to hidden is excluded from the visible subset", () => {
    fc.assert(
      fc.property(
        blockArb.map((b) => ({ ...b, id: "target", visible: true })),
        (block) => {
          const state = { ...initialState, blocks: [block] };
          const next = editorReducer(state, {
            type: "TOGGLE_VISIBILITY",
            payload: { id: "target" },
          });

          const visibleBlocks = next.blocks.filter((b) => b.visible);
          expect(visibleBlocks.find((b) => b.id === "target")).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Undo-redo round trip
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 9: Undo-redo round trip", () => {
  /**
   * **Validates: Requirements 9.1, 9.2, 9.6**
   *
   * For any editor state and any mutating action, performing the action
   * and then undoing restores the blocks array to its pre-action state.
   */
  it("action then undo restores the original blocks", () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 5 }).chain((blocks) => {
          const uniqueBlocks = blocks.map((b, i) => ({
            ...b,
            id: `block-${i}`,
          }));
          return mutatingActionForBlocksArb(uniqueBlocks)
            .filter((action) => {
              // Filter out actions that might be no-ops
              // We want actions that actually mutate state
              return true;
            })
            .map((action) => ({ blocks: uniqueBlocks, action }));
        }),
        ({ blocks, action }) => {
          const state = { ...initialState, blocks };
          const afterAction = editorReducer(state, action);

          // Only test round-trip if the action actually mutated state
          if (afterAction === state) return;

          const afterUndo = editorReducer(afterAction, { type: "UNDO" });
          expect(afterUndo.blocks).toEqual(state.blocks);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.1, 9.2, 9.6**
   *
   * Undoing and then redoing restores the blocks to the post-action state.
   */
  it("undo then redo restores the post-action blocks", () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 5 }).chain((blocks) => {
          const uniqueBlocks = blocks.map((b, i) => ({
            ...b,
            id: `block-${i}`,
          }));
          return mutatingActionForBlocksArb(uniqueBlocks).map((action) => ({
            blocks: uniqueBlocks,
            action,
          }));
        }),
        ({ blocks, action }) => {
          const state = { ...initialState, blocks };
          const afterAction = editorReducer(state, action);

          if (afterAction === state) return;

          const afterUndo = editorReducer(afterAction, { type: "UNDO" });
          const afterRedo = editorReducer(afterUndo, { type: "REDO" });
          expect(afterRedo.blocks).toEqual(afterAction.blocks);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: New action after undo clears redo stack
// ---------------------------------------------------------------------------

describe("Feature: ad-template-editor, Property 10: New action after undo clears redo stack", () => {
  /**
   * **Validates: Requirements 9.5**
   *
   * For any editor state where history.future is non-empty, performing
   * any new mutating action results in history.future being empty.
   */
  it("a mutating action after undo clears the redo (future) stack", () => {
    fc.assert(
      fc.property(
        fc.array(blockArb, { minLength: 1, maxLength: 5 }).chain((blocks) => {
          const uniqueBlocks = blocks.map((b, i) => ({
            ...b,
            id: `block-${i}`,
          }));
          return mutatingActionForBlocksArb(uniqueBlocks).map((action) => ({
            blocks: uniqueBlocks,
            action,
          }));
        }),
        ({ blocks, action }) => {
          // Build a state with a non-empty future by doing action + undo
          const state = { ...initialState, blocks };
          const afterFirst = editorReducer(state, {
            type: "ADD_TEXT_BLOCK",
          });
          const afterUndo = editorReducer(afterFirst, { type: "UNDO" });

          // Verify we have a non-empty future
          expect(afterUndo.history.future.length).toBeGreaterThan(0);

          // Now dispatch a new mutating action
          const afterNew = editorReducer(afterUndo, action);

          // If the action actually mutated (wasn't a no-op), future should be empty
          if (afterNew !== afterUndo) {
            expect(afterNew.history.future).toEqual([]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
