import { useRef, useState } from "react";
import { useEditor } from "../context/EditorContext";
import { exportPng } from "../utils/exportPng";

const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg"];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg";

export function Toolbar() {
  const { state, dispatch, stageRef } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleAddText = () => {
    dispatch({ type: "ADD_TEXT_BLOCK" });
  };

  const handleAddImageClick = () => {
    setImageError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be selected again
    e.target.value = "";

    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setImageError("Only PNG and JPEG images are supported.");
      return;
    }

    setImageError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const imageSrc = reader.result as string;
      dispatch({ type: "ADD_IMAGE_BLOCK", payload: { imageSrc } });
    };
    reader.onerror = () => {
      setImageError("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  };

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleRedo = () => {
    dispatch({ type: "REDO" });
  };

  const handleExport = () => {
    if (stageRef.current) {
      exportPng(stageRef.current);
    }
  };

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return (
    <div className="toolbar" role="toolbar" aria-label="Editor toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={handleAddText}
          aria-label="Add text block"
        >
          Add Text
        </button>
        <button
          className="toolbar-btn"
          onClick={handleAddImageClick}
          aria-label="Add image block"
        >
          Add Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          style={{ display: "none" }}
          aria-hidden="true"
        />
      </div>

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          className="toolbar-btn"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          Redo
        </button>
      </div>

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={handleExport}
          aria-label="Export as PNG"
        >
          Export PNG
        </button>
      </div>

      {imageError && (
        <div className="toolbar-error" role="alert">
          {imageError}
        </div>
      )}
    </div>
  );
}
