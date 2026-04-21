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

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    dispatch({ type: "SELECT_BLOCK", payload: { id: block.id } });
  };

  return (
    <Text
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
    />
  );
}
