import { useEditor } from "../context/EditorContext";
import type { Block } from "../types";

export function LayerPanel() {
  const { state, dispatch } = useEditor();

  // Display blocks ordered by layerIndex descending (topmost first)
  const sortedBlocks = [...state.blocks].sort(
    (a, b) => b.layerIndex - a.layerIndex,
  );

  const maxLayerIndex = Math.max(...state.blocks.map((b) => b.layerIndex), -1);
  const minLayerIndex =
    state.blocks.length > 0
      ? Math.min(...state.blocks.map((b) => b.layerIndex))
      : 0;

  const handleMoveUp = (id: string) => {
    dispatch({ type: "MOVE_LAYER_UP", payload: { id } });
  };

  const handleMoveDown = (id: string) => {
    dispatch({ type: "MOVE_LAYER_DOWN", payload: { id } });
  };

  const handleToggleVisibility = (id: string) => {
    dispatch({ type: "TOGGLE_VISIBILITY", payload: { id } });
  };

  const handleSelectBlock = (id: string) => {
    dispatch({ type: "SELECT_BLOCK", payload: { id } });
  };

  const isAtTop = (block: Block) => block.layerIndex === maxLayerIndex;
  const isAtBottom = (block: Block) => block.layerIndex === minLayerIndex;

  return (
    <div className="layer-panel" role="region" aria-label="Layer panel">
      <h3 className="layer-panel-title">Layers</h3>
      {sortedBlocks.length === 0 ? (
        <p className="layer-panel-empty">No layers yet</p>
      ) : (
        <ul className="layer-list" role="list">
          {sortedBlocks.map((block) => (
            <li
              key={block.id}
              className={`layer-item${block.id === state.selectedBlockId ? " layer-item--selected" : ""}`}
              role="listitem"
            >
              <button
                className="layer-item-name"
                onClick={() => handleSelectBlock(block.id)}
                aria-label={`Select ${block.name}`}
                title={block.name}
              >
                <span className="layer-item-type-icon" aria-hidden="true">
                  {block.type === "text" ? "T" : "🖼"}
                </span>
                <span className="layer-item-label">{block.name}</span>
              </button>

              <div className="layer-item-controls">
                <button
                  className="layer-control-btn"
                  onClick={() => handleToggleVisibility(block.id)}
                  aria-label={
                    block.visible ? `Hide ${block.name}` : `Show ${block.name}`
                  }
                  title={block.visible ? "Hide" : "Show"}
                >
                  {block.visible ? "👁" : "👁‍🗨"}
                </button>
                <button
                  className="layer-control-btn"
                  onClick={() => handleMoveUp(block.id)}
                  disabled={isAtTop(block)}
                  aria-label={`Move ${block.name} up`}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  className="layer-control-btn"
                  onClick={() => handleMoveDown(block.id)}
                  disabled={isAtBottom(block)}
                  aria-label={`Move ${block.name} down`}
                  title="Move down"
                >
                  ▼
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
