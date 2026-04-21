# Implementation Plan: Properties Panel

## Overview

Add a Properties Panel sidebar to the Ad Template Editor that displays and allows editing of the selected block's properties. The panel uses the existing reducer actions (UPDATE_BLOCK, UPDATE_TEXT_CONTENT) and slots into the layout between the canvas and layer panel.

## Tasks

- [x] 1. Create the PropertiesPanel component with empty state
  - [x] 1.1 Create `src/components/PropertiesPanel.tsx` with basic structure
    - Import `useEditor` from context
    - Read `selectedBlockId` and `blocks` from state
    - Find the selected block by id
    - When no block is selected, render: "Select a block to edit its properties"
    - When a block is selected, render the block name as a heading
    - Apply className `properties-panel` for styling
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Add common property inputs (position, size, rotation)
  - [x] 2.1 Add numeric input fields for x, y, width, height, and rotation
    - Each field is a controlled `<input type="number">` bound to the block's current value
    - Group inputs under a "Position", "Size", and "Rotation" layout
    - _Requirements: 2.1, 2.3_

  - [x] 2.2 Wire onChange handlers to dispatch UPDATE_BLOCK
    - On change, parse the numeric value and dispatch `UPDATE_BLOCK` with the block id and changed property
    - On blur, coerce width/height to minimum 20 if below threshold
    - _Requirements: 2.2, 2.4, 5.1, 5.2_

- [x] 3. Add text-specific property controls
  - [x] 3.1 Conditionally render text controls when a TextBlock is selected
    - Add a textarea or text input for text content
    - Add a numeric input for font size (min 1, coerced on blur)
    - Add a `<select>` dropdown for font family with options: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana
    - Add a color input (`<input type="color">`) for fill color
    - _Requirements: 3.1, 3.6, 5.3_

  - [x] 3.2 Wire text property change handlers
    - Text content changes dispatch `UPDATE_TEXT_CONTENT`
    - Font size, font family, and fill color changes dispatch `UPDATE_BLOCK`
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 4. Add image-specific controls
  - [x] 4.1 Conditionally render image controls when an ImageBlock is selected
    - Display a thumbnail `<img>` preview of the image source
    - Add onError handler to show fallback text if image fails to load
    - Do NOT render text-specific controls for image blocks
    - _Requirements: 4.1, 4.2_

- [x] 5. Integrate into App layout and add styling
  - [x] 5.1 Update `src/App.tsx` to include PropertiesPanel between canvas and LayerPanel
    - Import and render `<PropertiesPanel />` in the app-body div, after canvas-area and before LayerPanel
    - _Requirements: 6.1_

  - [x] 5.2 Add CSS styles for the properties panel in `src/App.css`
    - Fixed width matching LayerPanel (220px)
    - `overflow-y: auto` for scrollable content
    - Consistent styling: neutral background, subtle borders, compact inputs
    - Style input groups, labels, and controls
    - _Requirements: 6.2, 6.3_

- [ ] 6. Verification checkpoint
  - Build the project (`npm run build`) and verify no type errors
  - Manually verify: select a text block → panel shows all controls; select an image block → panel shows thumbnail, no text controls; deselect → empty state message
  - Verify editing a property in the panel updates the block on canvas
  - Verify dragging a block on canvas updates the panel values

- [-] 7. Optional: Unit and property-based tests
  - [x] 7.1 Write example-based unit tests for PropertiesPanel
    - Test empty state message when no block selected
    - Test text block shows text-specific controls
    - Test image block shows thumbnail, hides text controls
    - Test font family dropdown has all 6 options
    - _Requirements: 1.2, 3.1, 3.6, 4.1, 4.2_

  - [-] 7.2 Write property-based tests for PropertiesPanel dispatch behavior
    - Property 1: Selected block properties displayed correctly
    - Property 2: Common property edits dispatch correct UPDATE_BLOCK
    - Property 3: Text content edits dispatch correct UPDATE_TEXT_CONTENT
    - Property 4: Minimum value coercion for constrained fields
    - _Requirements: 1.3, 2.2, 3.2, 5.2, 5.3_

## Notes

- Tasks 7.x are optional — the user wants minimal tests and fast implementation.
- No new reducer actions or types are needed. The panel uses existing `UPDATE_BLOCK` and `UPDATE_TEXT_CONTENT` actions.
- The panel reads entirely from `EditorContext` — no props needed.
- Validation coercion happens at the component level (on blur) for immediate feedback, complementing the reducer's existing min-size enforcement.
