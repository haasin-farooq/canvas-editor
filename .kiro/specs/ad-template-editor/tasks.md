# Implementation Plan: Ad Template Editor

## Overview

A React + TypeScript ad template editor using react-konva. The implementation is broken into small, focused slices — each task is a self-contained unit of work that builds incrementally on the previous one. No orphaned code; every slice wires into the running app.

## Tasks

- [x] 1. Set up project scaffolding and install dependencies
  - Install `react-konva`, `konva`, `react-konva-utils`, `nanoid`
  - Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `jest-canvas-mock`
  - Configure Vitest with canvas mock setup
  - _Requirements: all (foundational)_

- [x] 2. Define data models and constants
  - [x] 2.1 Create `src/types.ts` with `BaseBlock`, `TextBlock`, `ImageBlock`, `Block` union type, `EditorState`, `HistoryState`, and `EditorAction` types
    - Follow the interfaces exactly as specified in the design document
    - _Requirements: 2.2, 3.3_

  - [x] 2.2 Create `src/constants.ts` with `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MIN_BLOCK_SIZE`, `TEXT_BLOCK_DEFAULTS`, `IMAGE_BLOCK_DEFAULTS`, and `initialState`
    - Canvas defaults: 800×600, min block size 20×20
    - Text defaults: center position, "Edit me", Arial 24px, #333333
    - Image defaults: center position, 200×200
    - _Requirements: 1.1, 2.1, 2.2, 3.3, 6.3_

- [ ] 3. Implement the editor reducer — core state transitions
  - [ ] 3.1 Create `src/reducer.ts` with the `withSnapshot` helper function
    - Pushes current blocks onto `history.past`, clears `history.future`
    - _Requirements: 9.5, 9.6_

  - [ ] 3.2 Implement `ADD_TEXT_BLOCK` action in the reducer
    - Create a new TextBlock with defaults, assign highest layerIndex, generate unique id and name
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Implement `ADD_IMAGE_BLOCK` action in the reducer
    - Create a new ImageBlock with defaults + provided imageSrc, assign highest layerIndex
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.4 Implement `SELECT_BLOCK` action in the reducer
    - Set `selectedBlockId` to the given id (or null); guard against invalid ids
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ] 3.5 Implement `UPDATE_BLOCK` action in the reducer
    - Apply partial changes to the matching block, push snapshot, enforce min size constraint (20×20)
    - Guard against non-existent block ids
    - _Requirements: 5.2, 6.2, 6.3, 7.2_

  - [ ] 3.6 Implement `UNDO` and `REDO` actions in the reducer
    - Undo: pop from past, push current to future
    - Redo: pop from future, push current to past
    - No-op when stack is empty
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 3.7 Implement `MOVE_LAYER_UP` and `MOVE_LAYER_DOWN` actions in the reducer
    - Swap layerIndex with the adjacent block, push snapshot
    - No-op at boundaries
    - _Requirements: 8.2, 8.3, 8.6, 8.7, 8.8_

  - [ ] 3.8 Implement `TOGGLE_VISIBILITY` action in the reducer
    - Flip the `visible` property of the target block, push snapshot
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ] 3.9 Implement `UPDATE_TEXT_CONTENT` action in the reducer
    - Update the text property of a TextBlock, push snapshot
    - _Requirements: 11.3_

- [ ] 4. Checkpoint — Verify reducer logic
  - Ensure all reducer tests pass, ask the user if questions arise.

- [ ] 5. Property-based tests for the reducer
  - [ ]\* 5.1 Write property test: Block rendering order matches layerIndex
    - **Property 1: Block rendering order matches layerIndex**
    - Generate random block arrays, sort by layerIndex, verify order is consistent
    - **Validates: Requirements 1.3, 8.1**

  - [ ]\* 5.2 Write property test: New blocks receive the highest layerIndex
    - **Property 2: New blocks receive the highest layerIndex**
    - Generate random block arrays, dispatch ADD_TEXT_BLOCK or ADD_IMAGE_BLOCK, verify new block has max layerIndex
    - **Validates: Requirements 2.3, 3.4**

  - [ ]\* 5.3 Write property test: Mutating actions push a history snapshot
    - **Property 3: Mutating actions push a history snapshot**
    - Generate random state + mutating action, verify history.past grows by 1 and contains pre-action blocks
    - **Validates: Requirements 2.4, 3.5, 5.2, 6.2, 7.2, 8.6**

  - [ ]\* 5.4 Write property test: Selection invariant
    - **Property 4: Selection invariant**
    - Generate random action sequences, verify selectedBlockId is null or a valid block id
    - **Validates: Requirements 4.4**

  - [ ]\* 5.5 Write property test: Minimum block size constraint
    - **Property 5: Minimum block size constraint**
    - Generate random resize operations with small target sizes, verify width and height >= 20
    - **Validates: Requirements 6.3**

  - [ ]\* 5.6 Write property test: Layer swap correctness
    - **Property 6: Layer swap correctness**
    - Generate random block arrays, pick a non-boundary block, move up/down, verify swap and index set preservation
    - **Validates: Requirements 8.2, 8.3**

  - [ ]\* 5.7 Write property test: Visibility toggle is an involution
    - **Property 7: Visibility toggle is an involution**
    - Generate random booleans, toggle twice, verify identity
    - **Validates: Requirements 8.4**

  - [ ]\* 5.8 Write property test: Only visible blocks are rendered
    - **Property 8: Only visible blocks are rendered**
    - Generate random blocks with mixed visibility, filter to visible, verify subset correctness
    - **Validates: Requirements 8.5, 10.4**

  - [ ]\* 5.9 Write property test: Undo-redo round trip
    - **Property 9: Undo-redo round trip**
    - Generate random state + action, apply then undo → blocks restored; undo then redo → blocks restored
    - **Validates: Requirements 9.1, 9.2, 9.6**

  - [ ]\* 5.10 Write property test: New action after undo clears redo stack
    - **Property 10: New action after undo clears redo stack**
    - Generate state with non-empty future, dispatch mutating action, verify future is empty
    - **Validates: Requirements 9.5**

- [ ] 6. Create the EditorProvider context
  - [ ] 6.1 Create `src/context/EditorContext.ts` with `EditorContext` and `useEditor` custom hook
    - Context provides `{ state, dispatch }` as defined in the design
    - `useEditor` hook throws if used outside provider
    - _Requirements: all (foundational wiring)_

  - [ ] 6.2 Create `src/context/EditorProvider.tsx` component
    - Wraps children with context, owns `useReducer(editorReducer, initialState)`
    - Registers keyboard shortcuts: Ctrl+Z for undo, Ctrl+Shift+Z for redo
    - _Requirements: 9.1, 9.2_

- [ ] 7. Implement the Toolbar component
  - [ ] 7.1 Create `src/components/Toolbar.tsx` with Add Text and Add Image buttons
    - "Add Text" dispatches `ADD_TEXT_BLOCK`
    - "Add Image" opens a file input that accepts `.png,.jpg,.jpeg`
    - Validate MIME type before dispatching; show error for invalid files
    - Read file as data URL via FileReader, dispatch `ADD_IMAGE_BLOCK`
    - _Requirements: 2.1, 3.1, 3.2, 3.6_

  - [ ] 7.2 Add Undo and Redo buttons to the Toolbar
    - Undo dispatches `UNDO`, disabled when `history.past.length === 0`
    - Redo dispatches `REDO`, disabled when `history.future.length === 0`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 7.3 Add Export PNG button to the Toolbar (placeholder — export logic comes later)
    - Button renders but export handler will be wired in a later task
    - _Requirements: 10.1 (partial)_

- [ ] 8. Implement the EditorCanvas — basic rendering
  - [ ] 8.1 Create `src/components/EditorCanvas.tsx` with Konva Stage and Layer
    - Render Stage at 800×600 with a white background Rect
    - Click on empty area dispatches `SELECT_BLOCK` with `null`
    - _Requirements: 1.1, 1.2, 4.3_

  - [ ] 8.2 Render blocks on the canvas sorted by layerIndex
    - Map `state.blocks` sorted by `layerIndex` ascending
    - Filter to only `visible === true` blocks
    - Render `TextBlock` or `ImageBlock` component based on block type
    - _Requirements: 1.3, 8.5_

- [ ] 9. Implement the TextBlock canvas component
  - [ ] 9.1 Create `src/components/canvas/TextBlock.tsx`
    - Render a Konva `<Text>` node with block properties (x, y, width, height, rotation, text, fontSize, fontFamily, fill)
    - Make it draggable
    - On click, dispatch `SELECT_BLOCK`
    - _Requirements: 2.2, 4.1_

  - [ ] 9.2 Handle drag end on TextBlock
    - Read `e.target.x()` and `e.target.y()` on `onDragEnd`
    - Dispatch `UPDATE_BLOCK` with new position
    - _Requirements: 5.1, 5.2_

  - [ ] 9.3 Handle transform end on TextBlock
    - Read updated width, height, rotation, x, y from the Konva node on `onTransformEnd`
    - Dispatch `UPDATE_BLOCK` with new size, rotation, and position
    - _Requirements: 6.1, 6.2, 7.1, 7.2_

- [ ] 10. Implement the ImageBlock canvas component
  - [ ] 10.1 Create `src/components/canvas/ImageBlock.tsx`
    - Render a Konva `<Image>` node using `useImage` hook from `react-konva-utils`
    - Make it draggable
    - On click, dispatch `SELECT_BLOCK`
    - _Requirements: 3.2, 3.3, 4.1_

  - [ ] 10.2 Handle drag end and transform end on ImageBlock
    - Same pattern as TextBlock: dispatch `UPDATE_BLOCK` with updated position/size/rotation
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1, 7.2_

- [ ] 11. Implement the TransformerComponent
  - Create `src/components/canvas/TransformerComponent.tsx`
  - Render a Konva `<Transformer>` that attaches to the selected block's node ref
  - Enforce minimum size constraint: `boundBoxFunc` clamps width/height to >= 20
  - Attach/detach based on `selectedBlockId`
  - _Requirements: 4.2, 6.3_

- [ ] 12. Checkpoint — Verify canvas interactions
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: blocks render, drag works, resize works, rotate works, selection works.

- [ ] 13. Implement the LayerPanel component
  - [ ] 13.1 Create `src/components/LayerPanel.tsx` with block list
    - Display all blocks ordered by layerIndex descending (topmost first)
    - Each item shows the block name (e.g., "Text 1", "Image 2")
    - _Requirements: 8.1_

  - [ ] 13.2 Add Move Up and Move Down controls to LayerPanel
    - "Move Up" dispatches `MOVE_LAYER_UP`, disabled at top boundary
    - "Move Down" dispatches `MOVE_LAYER_DOWN`, disabled at bottom boundary
    - _Requirements: 8.2, 8.3, 8.7, 8.8_

  - [ ] 13.3 Add visibility toggle to LayerPanel
    - Toggle button dispatches `TOGGLE_VISIBILITY`
    - Visual indicator for visible/hidden state
    - _Requirements: 8.4, 8.5, 8.6_

- [ ] 14. Implement inline text editing
  - [ ] 14.1 Create `src/components/canvas/TextEditOverlay.tsx`
    - Render an HTML `<textarea>` positioned over the selected TextBlock
    - Position and size the textarea to match the block's canvas coordinates
    - _Requirements: 11.1, 11.2_

  - [ ] 14.2 Wire inline editing activation and deactivation
    - Double-click on TextBlock activates editing (sets `isEditingText: true`)
    - Click outside or press Escape deactivates editing
    - On deactivation, dispatch `UPDATE_TEXT_CONTENT` with the textarea value
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 15. Implement PNG export
  - [ ] 15.1 Create `src/utils/exportPng.ts` utility function
    - Accept a Konva Stage ref
    - Temporarily hide the Transformer
    - Call `stage.toDataURL()` to generate PNG
    - Trigger browser download with filename "ad-export.png"
    - Restore Transformer visibility
    - Wrap in try/catch for error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 15.2 Wire the Export PNG button in the Toolbar
    - Pass Stage ref from EditorCanvas up to Toolbar (via context or prop)
    - Call `exportPng` on button click
    - _Requirements: 10.1, 10.2_

- [ ] 16. Assemble the App layout
  - Create `src/App.tsx` that composes `EditorProvider` > `Toolbar` + `EditorCanvas` + `LayerPanel`
  - Apply layout styling: Toolbar on top, Canvas in center, LayerPanel on the right
  - Style with Smartly-inspired design: neutral backgrounds, subtle borders, compact controls
  - _Requirements: all (integration)_

- [ ] 17. Unit tests for key UI interactions
  - [ ]\* 17.1 Write unit tests for Toolbar (add text, add image with file validation, undo/redo button states)
    - _Requirements: 2.1, 3.1, 3.6, 9.3, 9.4_

  - [ ]\* 17.2 Write unit tests for LayerPanel (ordering, move up/down disabled states, visibility toggle)
    - _Requirements: 8.1, 8.7, 8.8_

  - [ ]\* 17.3 Write unit tests for export functionality (Transformer hidden, download triggered)
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 18. Final checkpoint — Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP.
- Each task references specific requirement clauses for traceability.
- The reducer is implemented first (tasks 3.x) because it's the pure-logic core — easy to test, no UI dependencies.
- Property-based tests (tasks 5.x) target the reducer directly since it's a pure function.
- Canvas components (tasks 8–11) build incrementally: first the stage, then individual block types, then the transformer.
- Checkpoints at tasks 4, 12, and 18 ensure incremental validation.
