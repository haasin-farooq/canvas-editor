import {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type Konva from "konva";
import { EditorContext } from "./EditorContext";
import { editorReducer } from "../reducer";
import { initialState } from "../constants";

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const stageRef = useRef<Konva.Stage | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept keyboard shortcuts while inline text editing is active
      if (state.isEditingText) return;

      // Ctrl+Shift+Z or Cmd+Shift+Z → Redo (check before undo since it's more specific)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        dispatch({ type: "REDO" });
        return;
      }

      // Ctrl+Z or Cmd+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        return;
      }
    },
    [dispatch, state.isEditingText],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <EditorContext.Provider value={{ state, dispatch, stageRef }}>
      {children}
    </EditorContext.Provider>
  );
}
