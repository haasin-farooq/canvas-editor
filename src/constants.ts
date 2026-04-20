import type { EditorState, ImageBlock, TextBlock } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const MIN_BLOCK_SIZE = 20;

export const TEXT_BLOCK_DEFAULTS: Omit<
  TextBlock,
  "id" | "layerIndex" | "name"
> = {
  type: "text",
  x: 400,
  y: 300,
  width: 200,
  height: 50,
  rotation: 0,
  visible: true,
  text: "Edit me",
  fontSize: 24,
  fontFamily: "Arial",
  fill: "#333333",
};

export const IMAGE_BLOCK_DEFAULTS: Omit<
  ImageBlock,
  "id" | "layerIndex" | "name" | "imageSrc"
> = {
  type: "image",
  x: 400,
  y: 300,
  width: 200,
  height: 200,
  rotation: 0,
  visible: true,
};

export const initialState: EditorState = {
  blocks: [],
  selectedBlockId: null,
  isEditingText: false,
  history: {
    past: [],
    future: [],
  },
};
