import { useRef } from "react";
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
  const shapeRef = useRef<Konva.Image>(null);
  const [image] = useImage(block.imageSrc);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    dispatch({ type: "SELECT_BLOCK", payload: { id: block.id } });
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
    <Image
      ref={shapeRef}
      id={block.id}
      x={block.x}
      y={block.y}
      width={block.width}
      height={block.height}
      rotation={block.rotation}
      image={image}
      draggable
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}
