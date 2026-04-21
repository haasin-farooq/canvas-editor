import { useState, useEffect } from "react";
import { useEditor } from "../context/EditorContext";
import { MIN_BLOCK_SIZE } from "../constants";
import type { Block, TextBlock } from "../types";

const MIN_FONT_SIZE = 1;

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
] as const;

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  min?: number;
  step?: number;
}

function NumberInput({
  label,
  value,
  onChange,
  onBlur,
  min,
  step = 1,
}: NumberInputProps) {
  return (
    <label className="properties-field">
      <span className="properties-field-label">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        onBlur={onBlur}
      />
    </label>
  );
}

export function PropertiesPanel() {
  const { state, dispatch } = useEditor();
  const { selectedBlockId, blocks } = state;
  const [imageError, setImageError] = useState(false);

  const selectedBlock = selectedBlockId
    ? (blocks.find((b) => b.id === selectedBlockId) ?? null)
    : null;

  useEffect(() => {
    setImageError(false);
  }, [selectedBlockId]);

  const handleChange = (property: keyof Block, value: number) => {
    if (!selectedBlock) return;
    dispatch({
      type: "UPDATE_BLOCK",
      payload: { id: selectedBlock.id, changes: { [property]: value } },
    });
  };

  const handleBlurSize = (property: "width" | "height") => {
    if (!selectedBlock) return;
    if (selectedBlock[property] < MIN_BLOCK_SIZE) {
      dispatch({
        type: "UPDATE_BLOCK",
        payload: {
          id: selectedBlock.id,
          changes: { [property]: MIN_BLOCK_SIZE },
        },
      });
    }
  };

  const handleTextContentChange = (text: string) => {
    if (!selectedBlock) return;
    dispatch({
      type: "UPDATE_TEXT_CONTENT",
      payload: { id: selectedBlock.id, text },
    });
  };

  const handleTextPropertyChange = (
    property: keyof Pick<TextBlock, "fontSize" | "fontFamily" | "fill">,
    value: string | number,
  ) => {
    if (!selectedBlock) return;
    dispatch({
      type: "UPDATE_BLOCK",
      payload: { id: selectedBlock.id, changes: { [property]: value } },
    });
  };

  const handleBlurFontSize = () => {
    if (!selectedBlock || selectedBlock.type !== "text") return;
    if (selectedBlock.fontSize < MIN_FONT_SIZE) {
      dispatch({
        type: "UPDATE_BLOCK",
        payload: {
          id: selectedBlock.id,
          changes: { fontSize: MIN_FONT_SIZE },
        },
      });
    }
  };

  return (
    <div
      className="properties-panel"
      role="region"
      aria-label="Properties panel"
    >
      {selectedBlock === null ? (
        <p className="properties-panel-empty">
          Select a block to edit its properties
        </p>
      ) : (
        <>
          <h3 className="properties-panel-title">{selectedBlock.name}</h3>

          <div className="properties-group">
            <h4 className="properties-group-heading">Position</h4>
            <NumberInput
              label="X"
              value={selectedBlock.x}
              onChange={(v) => handleChange("x", v)}
            />
            <NumberInput
              label="Y"
              value={selectedBlock.y}
              onChange={(v) => handleChange("y", v)}
            />
          </div>

          <div className="properties-group">
            <h4 className="properties-group-heading">Size</h4>
            <NumberInput
              label="Width"
              value={selectedBlock.width}
              onChange={(v) => handleChange("width", v)}
              onBlur={() => handleBlurSize("width")}
              min={MIN_BLOCK_SIZE}
            />
            <NumberInput
              label="Height"
              value={selectedBlock.height}
              onChange={(v) => handleChange("height", v)}
              onBlur={() => handleBlurSize("height")}
              min={MIN_BLOCK_SIZE}
            />
          </div>

          <div className="properties-group">
            <h4 className="properties-group-heading">Rotation</h4>
            <NumberInput
              label="Angle"
              value={selectedBlock.rotation}
              onChange={(v) => handleChange("rotation", v)}
            />
          </div>

          {selectedBlock.type === "image" && (
            <div className="properties-group">
              <h4 className="properties-group-heading">Image</h4>
              {imageError ? (
                <p className="properties-image-fallback">
                  Image preview unavailable
                </p>
              ) : (
                <img
                  src={selectedBlock.imageSrc}
                  alt="Image preview"
                  className="properties-image-thumbnail"
                  style={{ maxWidth: "100%", maxHeight: 120 }}
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          )}

          {selectedBlock.type === "text" && (
            <>
              <div className="properties-group">
                <h4 className="properties-group-heading">Text</h4>
                <label className="properties-field">
                  <span className="properties-field-label">Content</span>
                  <textarea
                    value={selectedBlock.text}
                    onChange={(e) => handleTextContentChange(e.target.value)}
                    rows={3}
                  />
                </label>
              </div>

              <div className="properties-group">
                <h4 className="properties-group-heading">Font</h4>
                <NumberInput
                  label="Size"
                  value={selectedBlock.fontSize}
                  onChange={(v) => handleTextPropertyChange("fontSize", v)}
                  onBlur={handleBlurFontSize}
                  min={MIN_FONT_SIZE}
                />
                <label className="properties-field">
                  <span className="properties-field-label">Family</span>
                  <select
                    value={selectedBlock.fontFamily}
                    onChange={(e) =>
                      handleTextPropertyChange("fontFamily", e.target.value)
                    }
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="properties-field">
                  <span className="properties-field-label">Color</span>
                  <input
                    type="color"
                    value={selectedBlock.fill}
                    onChange={(e) =>
                      handleTextPropertyChange("fill", e.target.value)
                    }
                  />
                </label>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
