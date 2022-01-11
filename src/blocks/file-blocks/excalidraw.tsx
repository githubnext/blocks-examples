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
    <div className="position-relative height-full">
      <div className="height-full width-full" key={content}>
        <Excalidraw initialData={JSON.parse(content)} onChange={handleChange} />
      </div>
      <button className="btn btn-primary position-absolute right-2 top-2"
        style={{ zIndex: 1 }}
        onClick={handleSave}>Save Changes</button>
    </div>
  );
}
