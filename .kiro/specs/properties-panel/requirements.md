# Requirements Document

## Introduction

A Properties Panel for the Ad Template Editor that allows users to inspect and edit properties of the currently selected block. The panel displays contextual controls based on the block type — common spatial properties (position, size, rotation) for all blocks, plus type-specific properties such as text content, font size, font family, and fill color for text blocks. The panel integrates with the existing `useReducer` + Context state management, dispatching `UPDATE_BLOCK` and `UPDATE_TEXT_CONTENT` actions to modify block properties. The panel appears alongside the existing Layer_Panel in the editor layout.

## Glossary

- **Editor**: The top-level React application that hosts the Canvas, Toolbar, Layer_Panel, and Properties_Panel.
- **Canvas**: The react-konva Stage where blocks are rendered and manipulated.
- **Block**: A visual element on the Canvas. A Block is either a Text_Block or an Image_Block.
- **Text_Block**: A Block that displays editable text content with configurable font properties.
- **Image_Block**: A Block that displays a user-provided raster image.
- **Properties_Panel**: The UI panel that displays and allows editing of the selected Block's properties.
- **Selection**: The currently active Block that displays the Transformer and receives property edits.
- **Common_Properties**: The set of properties shared by all Block types: position (x, y), size (width, height), and rotation.
- **Text_Properties**: The set of properties specific to Text_Blocks: text content, font size, font family, and fill color.

## Requirements

### Requirement 1: Properties Panel Display

**User Story:** As a user, I want to see a properties panel in the editor, so that I can view and edit block properties without guessing values.

#### Acceptance Criteria

1. THE Properties_Panel SHALL render as a sidebar panel within the Editor layout, positioned to the left of the Layer_Panel.
2. WHILE no Block is the Selection, THE Properties_Panel SHALL display a message indicating that no block is selected.
3. WHEN a Block becomes the Selection, THE Properties_Panel SHALL display the editable properties of the selected Block.
4. THE Properties_Panel SHALL display the name of the selected Block as a heading.

### Requirement 2: Common Property Controls

**User Story:** As a user, I want to edit position, size, and rotation of any block, so that I can precisely control block placement.

#### Acceptance Criteria

1. WHEN a Block is the Selection, THE Properties_Panel SHALL display numeric input fields for the Block's x position, y position, width, height, and rotation.
2. WHEN the user changes a value in a Common_Properties input field, THE Properties_Panel SHALL dispatch an UPDATE_BLOCK action with the updated property value.
3. THE Properties_Panel SHALL display the current property values of the selected Block in the input fields.
4. WHEN the selected Block's properties change via Canvas interaction (drag, resize, rotate), THE Properties_Panel SHALL reflect the updated values in the input fields.

### Requirement 3: Text Block Property Controls

**User Story:** As a user, I want to edit text-specific properties like font size, font family, and color, so that I can style my ad copy.

#### Acceptance Criteria

1. WHEN a Text_Block is the Selection, THE Properties_Panel SHALL display additional controls for text content, font size, font family, and fill color.
2. WHEN the user changes the text content in the Properties_Panel, THE Properties_Panel SHALL dispatch an UPDATE_TEXT_CONTENT action with the updated text.
3. WHEN the user changes the font size in the Properties_Panel, THE Properties_Panel SHALL dispatch an UPDATE_BLOCK action with the updated fontSize value.
4. WHEN the user changes the font family in the Properties_Panel, THE Properties_Panel SHALL dispatch an UPDATE_BLOCK action with the updated fontFamily value.
5. WHEN the user changes the fill color in the Properties_Panel, THE Properties_Panel SHALL dispatch an UPDATE_BLOCK action with the updated fill value.
6. THE Properties_Panel SHALL provide a dropdown select for font family with the following options: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana.

### Requirement 4: Image Block Property Controls

**User Story:** As a user, I want to see image-specific information in the properties panel, so that I can identify which image a block uses.

#### Acceptance Criteria

1. WHEN an Image_Block is the Selection, THE Properties_Panel SHALL display a thumbnail preview of the image source.
2. WHEN an Image_Block is the Selection, THE Properties_Panel SHALL not display text-specific controls (text content, font size, font family, fill color).

### Requirement 5: Input Validation

**User Story:** As a user, I want the properties panel to enforce valid values, so that I do not accidentally break my layout.

#### Acceptance Criteria

1. THE Properties_Panel SHALL accept only numeric values for position (x, y), size (width, height), rotation, and font size input fields.
2. WHEN the user enters a width or height value below 20, THE Properties_Panel SHALL coerce the value to 20 before dispatching the update, consistent with the minimum block size constraint.
3. WHEN the user enters a font size value below 1, THE Properties_Panel SHALL coerce the value to 1 before dispatching the update.

### Requirement 6: Layout Integration

**User Story:** As a user, I want the properties panel to fit naturally into the editor layout, so that my workflow is not disrupted.

#### Acceptance Criteria

1. THE Editor layout SHALL place the Properties_Panel between the Canvas area and the Layer_Panel.
2. THE Properties_Panel SHALL have a fixed width consistent with the Layer_Panel styling.
3. THE Properties_Panel SHALL be scrollable when its content exceeds the available vertical space.
