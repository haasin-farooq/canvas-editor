import { useRef } from "react";
import { Text } from "react-konva";
import type { TextBlock as TextBlockType } from "../../types";
import { useEditor } from "../../context/EditorContext";
import type Konva from "konva";

interface TextBlockProps {
  block: TextBlockType;
  isSelected: boolean;
}

export function TextBlock({ block }: TextBlockProps) {
  const { dispatch } = useEditor();
  const shapeRef = useRef<Konva.Text>(null);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    dispatch({ type: "SELECT_BLOCK", payload: { id: block.id } });
  };

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    dispatch({ type: "SET_EDITING_TEXT", payload: { editing: true } });
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    dispatch({
      type: "UPDATE_BLOCK",
      payload: {
        id: block.id,
        changes: {
          x: e.target.x(),
          y: e.target.y(),
        },
      },
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply it to width/height instead
    node.scaleX(1);
    node.scaleY(1);

    dispatch({
      type: "UPDATE_BLOCK",
      payload: {
        id: block.id,
        changes: {
          x: node.x(),
          y: node.y(),
          width: node.width() * scaleX,
          height: node.height() * scaleY,
          rotation: node.rotation(),
        },
      },
    });
  };

  return (
    <Text
      ref={shapeRef}
      id={block.id}
      x={block.x}
      y={block.y}
      width={block.width}
      height={block.height}
      rotation={block.rotation}
      text={block.text}
      fontSize={block.fontSize}
      fontFamily={block.fontFamily}
      fill={block.fill}
      draggable
      onClick={handleClick}
      onDblClick={handleDblClick}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
