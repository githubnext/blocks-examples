import { FileBlockProps } from "@githubnext/utils";
import { useEffect, useState } from "react";
import "./style.css";

if (typeof window !== "undefined") {
  // to load assets from self domain, instead of the CDN
  const urlObject = new URL(window.location.href);
  const prototypeDomain = "https://blocks.githubnext.com";
  const isPrototype = urlObject.origin === prototypeDomain;
  if (isPrototype) {
    // @ts-ignore
    window.EXCALIDRAW_ASSET_PATH = "/excalidraw/";
  }
}
export default function (props: FileBlockProps) {
  const { content, onRequestUpdateContent } = props;
  const [appState, setAppState] = useState(null);
  const [elements, setElements] = useState([]);
  const [excalModule, setExcalModule] = useState<any>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((imp) => {
      setExcalModule(imp);
    });
  }, []);

  const handleChange = (elements: any, appState: any) => {
    setElements(elements);
    setAppState(appState);
  };

  const handleSave = async () => {
    if (!excalModule) {
      console.error("Excalidraw is not loaded.");
      return;
    }
    const serialized = excalModule.serializeAsJSON(elements, appState);
    onRequestUpdateContent(serialized);
  };

  const ExcalidrawComponent = excalModule ? excalModule.default : null;

  return (
    <div className="position-relative height-full">
      <div className="width-full" key={content} style={{ height: "100vh" }}>
        {ExcalidrawComponent && (
          <ExcalidrawComponent
            initialData={JSON.parse(content)}
            onChange={handleChange}
          />
        )}
      </div>
      <button
        className="btn btn-primary position-absolute right-4 top-4 z-10"
        style={{ zIndex: 1 }}
        onClick={handleSave}
      >
        Save Changes
      </button>
    </div>
  );
}
