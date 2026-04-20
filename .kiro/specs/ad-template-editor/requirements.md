# Requirements Document

## Introduction

A mini ad template editor built with React, TypeScript, and react-konva. The editor allows users to compose ad creatives by placing text and image blocks on a canvas, manipulating them spatially (move, resize, rotate), managing layer ordering and visibility, undoing/redoing actions, and exporting the final composition as a PNG image. The visual style is inspired by Smartly's design language.

## Glossary

- **Editor**: The top-level React application that hosts the Canvas, Toolbar, and Layer_Panel.
- **Canvas**: The react-konva Stage where blocks are rendered and manipulated.
- **Block**: A visual element on the Canvas. A Block is either a Text_Block or an Image_Block.
- **Text_Block**: A Block that displays editable text content with configurable font properties.
- **Image_Block**: A Block that displays a user-provided raster image.
- **Transformer**: The Konva Transformer node that provides resize and rotate handles around a selected Block.
- **Layer_Panel**: The UI panel that lists all Blocks in their stacking order and provides reordering and visibility controls.
- **History_Stack**: The data structure that stores snapshots of editor state for undo and redo operations.
- **Toolbar**: The UI panel that provides actions for adding Blocks, triggering undo/redo, and exporting.
- **Selection**: The currently active Block that displays the Transformer and receives keyboard input.

## Requirements

### Requirement 1: Canvas Initialization

**User Story:** As a user, I want to see a blank canvas when I open the editor, so that I have a workspace to start composing my ad.

#### Acceptance Criteria

1. WHEN the Editor loads, THE Canvas SHALL render a Konva Stage with a fixed default size of 800×600 pixels.
2. WHEN the Editor loads, THE Canvas SHALL display a white background rectangle filling the entire Stage.
3. THE Canvas SHALL render all Blocks in the order defined by their layer index, where a higher index renders on top.

### Requirement 2: Add Text Block

**User Story:** As a user, I want to add text blocks to the canvas, so that I can include copy in my ad creative.

#### Acceptance Criteria

1. WHEN the user clicks the "Add Text" button in the Toolbar, THE Editor SHALL create a new Text_Block at the center of the Canvas with default placeholder text "Edit me".
2. THE Text_Block SHALL store the following properties: position (x, y), size (width, height), rotation angle, text content, font size, font family, and fill color.
3. WHEN a new Text_Block is created, THE Editor SHALL assign the Text_Block the highest layer index so that the Text_Block renders on top of all existing Blocks.
4. WHEN a new Text_Block is created, THE Editor SHALL push a snapshot onto the History_Stack.

### Requirement 3: Add Image Block

**User Story:** As a user, I want to add image blocks to the canvas, so that I can include visuals in my ad creative.

#### Acceptance Criteria

1. WHEN the user clicks the "Add Image" button in the Toolbar, THE Editor SHALL open a file picker that accepts PNG and JPEG formats.
2. WHEN the user selects a valid image file, THE Editor SHALL create a new Image_Block at the center of the Canvas displaying the selected image.
3. THE Image_Block SHALL store the following properties: position (x, y), size (width, height), rotation angle, and image source data.
4. WHEN a new Image_Block is created, THE Editor SHALL assign the Image_Block the highest layer index so that the Image_Block renders on top of all existing Blocks.
5. WHEN a new Image_Block is created, THE Editor SHALL push a snapshot onto the History_Stack.
6. IF the user selects a file that is not a PNG or JPEG, THEN THE Editor SHALL reject the file and display an error message indicating the supported formats.

### Requirement 4: Block Selection

**User Story:** As a user, I want to select a block on the canvas, so that I can manipulate it.

#### Acceptance Criteria

1. WHEN the user clicks on a Block on the Canvas, THE Editor SHALL set that Block as the Selection.
2. WHEN a Block becomes the Selection, THE Canvas SHALL attach the Transformer to the selected Block, displaying resize and rotate handles.
3. WHEN the user clicks on an empty area of the Canvas, THE Editor SHALL clear the Selection and detach the Transformer.
4. THE Editor SHALL allow exactly zero or one Block to be the Selection at any time.

### Requirement 5: Move Blocks

**User Story:** As a user, I want to drag blocks around the canvas, so that I can position elements in my ad layout.

#### Acceptance Criteria

1. WHEN the user drags a Block on the Canvas, THE Canvas SHALL update the Block position (x, y) to follow the pointer in real time.
2. WHEN the user releases a drag on a Block, THE Editor SHALL push a snapshot onto the History_Stack with the updated Block position.

### Requirement 6: Resize Blocks

**User Story:** As a user, I want to resize blocks, so that I can control the dimensions of each element.

#### Acceptance Criteria

1. WHEN the user drags a resize handle on the Transformer, THE Canvas SHALL update the Block size (width, height) in real time.
2. WHEN the user releases a resize handle, THE Editor SHALL push a snapshot onto the History_Stack with the updated Block size.
3. THE Transformer SHALL constrain the minimum Block size to 20×20 pixels to prevent Blocks from becoming invisible.

### Requirement 7: Rotate Blocks

**User Story:** As a user, I want to rotate blocks, so that I can angle elements for creative layouts.

#### Acceptance Criteria

1. WHEN the user drags the rotation handle on the Transformer, THE Canvas SHALL update the Block rotation angle in real time.
2. WHEN the user releases the rotation handle, THE Editor SHALL push a snapshot onto the History_Stack with the updated Block rotation.

### Requirement 8: Layer Management

**User Story:** As a user, I want to reorder and toggle visibility of layers, so that I can control the stacking and composition of my ad.

#### Acceptance Criteria

1. THE Layer_Panel SHALL display a list of all Blocks ordered by their layer index, with the topmost Block listed first.
2. WHEN the user clicks the "Move Up" control on a Block in the Layer_Panel, THE Editor SHALL increment that Block's layer index by one, swapping it with the Block above.
3. WHEN the user clicks the "Move Down" control on a Block in the Layer_Panel, THE Editor SHALL decrement that Block's layer index by one, swapping it with the Block below.
4. WHEN the user toggles the visibility control on a Block in the Layer_Panel, THE Editor SHALL toggle the visible property of that Block on the Canvas.
5. WHILE a Block has its visible property set to false, THE Canvas SHALL not render that Block.
6. WHEN the user changes layer order or visibility, THE Editor SHALL push a snapshot onto the History_Stack.
7. IF a Block is already at the highest layer index, THEN THE Editor SHALL disable the "Move Up" control for that Block.
8. IF a Block is already at the lowest layer index, THEN THE Editor SHALL disable the "Move Down" control for that Block.

### Requirement 9: Undo and Redo

**User Story:** As a user, I want to undo and redo my actions, so that I can experiment freely without fear of mistakes.

#### Acceptance Criteria

1. WHEN the user clicks the "Undo" button or presses Ctrl+Z, THE Editor SHALL restore the editor state to the previous snapshot in the History_Stack.
2. WHEN the user clicks the "Redo" button or presses Ctrl+Shift+Z, THE Editor SHALL restore the editor state to the next snapshot in the History_Stack.
3. IF there is no previous snapshot in the History_Stack, THEN THE Editor SHALL disable the "Undo" button.
4. IF there is no next snapshot in the History_Stack, THEN THE Editor SHALL disable the "Redo" button.
5. WHEN the user performs a new action after undoing, THE Editor SHALL discard all snapshots ahead of the current position in the History_Stack.
6. THE History_Stack SHALL store complete snapshots of all Block states, including position, size, rotation, visibility, layer index, and content.

### Requirement 10: Export to PNG

**User Story:** As a user, I want to export my canvas as a PNG, so that I can use the ad creative in campaigns.

#### Acceptance Criteria

1. WHEN the user clicks the "Export PNG" button in the Toolbar, THE Editor SHALL generate a PNG image of the Canvas content at the current Stage dimensions.
2. WHEN the PNG is generated, THE Editor SHALL trigger a browser download of the PNG file with the filename "ad-export.png".
3. WHILE exporting, THE Canvas SHALL hide the Transformer and Selection indicators so that they do not appear in the exported image.
4. THE Editor SHALL export only visible Blocks in the PNG output.

### Requirement 11: Text Block Inline Editing

**User Story:** As a user, I want to edit text directly on the canvas, so that I can quickly update ad copy.

#### Acceptance Criteria

1. WHEN the user double-clicks a Text_Block, THE Editor SHALL activate inline editing mode by overlaying an HTML textarea aligned with the Text_Block position and size on the Canvas.
2. WHILE inline editing mode is active, THE Editor SHALL synchronize the textarea content with the Text_Block text content.
3. WHEN the user clicks outside the textarea or presses Escape, THE Editor SHALL deactivate inline editing mode and push a snapshot onto the History_Stack with the updated text content.
