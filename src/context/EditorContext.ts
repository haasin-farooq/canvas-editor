import { createContext, useContext } from "react";
import type Konva from "konva";
import type { EditorState, EditorAction } from "../types";

export interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);
  if (context === null) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
