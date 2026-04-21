import { EditorProvider } from "./context/EditorProvider";
import { Toolbar } from "./components/Toolbar";
import { EditorCanvas } from "./components/EditorCanvas";
import { LayerPanel } from "./components/LayerPanel";
import "./App.css";

function App() {
  return (
    <EditorProvider>
      <div className="app">
        <Toolbar />
        <div className="app-body">
          <div className="canvas-area">
            <EditorCanvas />
          </div>
          <LayerPanel />
        </div>
      </div>
    </EditorProvider>
  );
}

export default App;
