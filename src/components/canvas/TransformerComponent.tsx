import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { MIN_BLOCK_SIZE } from "../../constants";

interface TransformerComponentProps {
  selectedBlockId: string | null;
}

export function TransformerComponent({
  selectedBlockId,
}: TransformerComponentProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedBlockId) {
      const stage = transformer.getStage();
      const selectedNode = stage?.findOne(`#${selectedBlockId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
      } else {
        transformer.nodes([]);
      }
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [selectedBlockId]);

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(_oldBox, newBox) => ({
        ...newBox,
        width: Math.max(MIN_BLOCK_SIZE, newBox.width),
        height: Math.max(MIN_BLOCK_SIZE, newBox.height),
      })}
    />
  );
}
