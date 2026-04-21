import { useState, useEffect, useRef, useCallback } from "react";
import type { TextBlock } from "../../types";
import { useEditor } from "../../context/EditorContext";

interface TextEditOverlayProps {
  block: TextBlock;
  stageContainer: HTMLDivElement | null;
}

/**
 * An HTML textarea overlay positioned over a TextBlock on the canvas.
 * Activated on double-click, deactivated on click-outside or Escape.
 * On deactivation, dispatches UPDATE_TEXT_CONTENT with the edited value.
 */
export function TextEditOverlay({
  block,
  stageContainer,
}: TextEditOverlayProps) {
  const { dispatch } = useEditor();
  const [value, setValue] = useState(block.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea on mount
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
  }, []);

  const deactivate = useCallback(
    (newText: string) => {
      dispatch({
        type: "UPDATE_TEXT_CONTENT",
        payload: { id: block.id, text: newText },
      });
      dispatch({ type: "SET_EDITING_TEXT", payload: { editing: false } });
    },
    [dispatch, block.id],
  );

  // Handle Escape key to deactivate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        deactivate(value);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deactivate, value]);

  // Handle click outside to deactivate
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        deactivate(value);
      }
    };
    // Use setTimeout so the double-click that activated editing doesn't
    // immediately trigger the outside-click handler
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [deactivate, value]);

  if (!stageContainer) return null;

  const rotationDeg = block.rotation || 0;

  const style: React.CSSProperties = {
    position: "absolute",
    top: `${block.y}px`,
    left: `${block.x}px`,
    width: `${block.width}px`,
    height: `${block.height}px`,
    transform: `rotate(${rotationDeg}deg)`,
    transformOrigin: "top left",
    fontSize: `${block.fontSize}px`,
    fontFamily: block.fontFamily,
    color: block.fill,
    border: "2px solid #0096FF",
    padding: "0",
    margin: "0",
    background: "rgba(255, 255, 255, 0.9)",
    outline: "none",
    resize: "none",
    overflow: "hidden",
    lineHeight: "1.2",
    zIndex: 1000,
    boxSizing: "border-box",
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={style}
      aria-label={`Edit text for ${block.name}`}
    />
  );
}
