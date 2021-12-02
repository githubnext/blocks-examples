import Excalidraw, { serializeAsJSON } from "@excalidraw/excalidraw";
import { FileBlockProps } from "@githubnext/utils";
import { useState } from "react";

export default function (props: FileBlockProps) {
  const { content, onRequestUpdateContent } = props;

  const [appState, setAppState] = useState(null);
  const [elements, setElements] = useState([]);

  const handleChange = (elements: any, appState: any) => {
    setElements(elements);
    setAppState(appState);
  };

  const handleSave = async () => {
    if (!serializeAsJSON) return;
    const serialized = serializeAsJSON(elements, appState);
    onRequestUpdateContent(serialized)
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}>
      <div style={{
        flex: "none"
      }}>
        <button onClick={handleSave}>Save Changes</button>
      </div>
      <div style={{
        flex: "1",
      }}>
        <Excalidraw initialData={JSON.parse(content)} onChange={handleChange} />
      </div>
    </div>
  );
}
