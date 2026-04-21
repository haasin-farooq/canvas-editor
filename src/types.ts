export interface BaseBlock {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  layerIndex: number;
  visible: boolean;
  name: string;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  imageSrc: string;
}

export type Block = TextBlock | ImageBlock;

export interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  isEditingText: boolean;
  history: HistoryState;
}

export interface HistoryState {
  past: Block[][];
  future: Block[][];
}

export type EditorAction =
  | { type: "ADD_TEXT_BLOCK" }
  | { type: "ADD_IMAGE_BLOCK"; payload: { imageSrc: string } }
  | { type: "SELECT_BLOCK"; payload: { id: string | null } }
  | { type: "UPDATE_BLOCK"; payload: { id: string; changes: Partial<Block> } }
  | { type: "MOVE_LAYER_UP"; payload: { id: string } }
  | { type: "MOVE_LAYER_DOWN"; payload: { id: string } }
  | { type: "TOGGLE_VISIBILITY"; payload: { id: string } }
  | { type: "UPDATE_TEXT_CONTENT"; payload: { id: string; text: string } }
  | { type: "SET_EDITING_TEXT"; payload: { editing: boolean } }
  | { type: "UNDO" }
  | { type: "REDO" };
