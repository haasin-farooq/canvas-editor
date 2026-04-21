import { Image } from "react-konva";
import { useImage } from "react-konva-utils";
import type { ImageBlock as ImageBlockType } from "../../types";
import { useEditor } from "../../context/EditorContext";
import type Konva from "konva";

interface ImageBlockProps {
  block: ImageBlockType;
  isSelected: boolean;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const { dispatch } = useEditor();
  const [image] = useImage(block.imageSrc);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    dispatch({ type: "SELECT_BLOCK", payload: { id: block.id } });
  };

  return (
    <Image
      id={block.id}
      x={block.x}
      y={block.y}
      width={block.width}
      height={block.height}
      rotation={block.rotation}
      image={image}
      draggable
      onClick={handleClick}
    />
  );
}
