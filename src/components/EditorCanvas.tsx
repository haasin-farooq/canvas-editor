import { useRef } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { useEditor } from "../context/EditorContext";
import { TextBlock } from "./canvas/TextBlock";
import { ImageBlock } from "./canvas/ImageBlock";
import { TransformerComponent } from "./canvas/TransformerComponent";
import { TextEditOverlay } from "./canvas/TextEditOverlay";
import type Konva from "konva";
import type { TextBlock as TextBlockType } from "../types";

export function EditorCanvas() {
  const { state, dispatch } = useEditor();
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect when clicking directly on the background rect or stage
    if (e.target === e.currentTarget || e.target.attrs.id === "background") {
      dispatch({ type: "SELECT_BLOCK", payload: { id: null } });
    }
  };

  const visibleBlocks = state.blocks
    .filter((block) => block.visible)
    .sort((a, b) => a.layerIndex - b.layerIndex);

  // Find the selected text block for inline editing
  const selectedTextBlock =
    state.isEditingText && state.selectedBlockId
      ? (state.blocks.find(
          (b) => b.id === state.selectedBlockId && b.type === "text",
        ) as TextBlockType | undefined)
      : undefined;

  return (
    <div
      ref={stageContainerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <Stage
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleStageClick}
      >
        <Layer>
          <Rect
            id="background"
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="white"
          />
          {visibleBlocks.map((block) =>
            block.type === "text" ? (
              <TextBlock
                key={block.id}
                block={block}
                isSelected={block.id === state.selectedBlockId}
              />
            ) : (
              <ImageBlock
                key={block.id}
                block={block}
                isSelected={block.id === state.selectedBlockId}
              />
            ),
          )}
          <TransformerComponent
            selectedBlockId={state.isEditingText ? null : state.selectedBlockId}
          />
        </Layer>
      </Stage>
      {selectedTextBlock && (
        <TextEditOverlay
          block={selectedTextBlock}
          stageContainer={stageContainerRef.current}
        />
      )}
    </div>
  );
}
