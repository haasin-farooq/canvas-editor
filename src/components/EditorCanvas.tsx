import { Stage, Layer, Rect } from "react-konva";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../constants";
import { useEditor } from "../context/EditorContext";
import type Konva from "konva";

export function EditorCanvas() {
  const { dispatch } = useEditor();

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect when clicking directly on the background rect or stage
    if (e.target === e.currentTarget || e.target.attrs.id === "background") {
      dispatch({ type: "SELECT_BLOCK", payload: { id: null } });
    }
  };

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
      </Layer>
    </Stage>
  );
}
