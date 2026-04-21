import { Stage, Layer, Rect } from "react-konva";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { useEditor } from "../context/EditorContext";
import { TextBlock } from "./canvas/TextBlock";
import { ImageBlock } from "./canvas/ImageBlock";
import type Konva from "konva";

export function EditorCanvas() {
  const { state, dispatch } = useEditor();

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect when clicking directly on the background rect or stage
    if (e.target === e.currentTarget || e.target.attrs.id === "background") {
      dispatch({ type: "SELECT_BLOCK", payload: { id: null } });
    }
  };

  const visibleBlocks = state.blocks
    .filter((block) => block.visible)
    .sort((a, b) => a.layerIndex - b.layerIndex);

  return (
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
      </Layer>
    </Stage>
  );
}
