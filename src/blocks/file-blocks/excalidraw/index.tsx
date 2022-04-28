import { FileBlockProps } from "@githubnext/utils";
import { useEffect, useState } from "react";
import "./style.css";

if (typeof window !== "undefined") {
  // to load assets from self domain, instead of the CDN
  const urlObject = new URL(window.location.href);
  const prototypeDomain = "https://blocks.githubnext.com";
  const isPrototype = urlObject.origin === prototypeDomain;
  if (isPrototype || process.env.NODE_ENV === "development") {
    // @ts-ignore
    window.EXCALIDRAW_ASSET_PATH = "/excalidraw/";
  }
}
export default function (props: FileBlockProps) {
  const { context, content, isEditable, onUpdateContent } = props;
  const [excalModule, setExcalModule] = useState<any>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((imp) => {
      setExcalModule(imp);
    });
  }, []);

  const handleChange = (elements: any, appState: any) => {
    if (!excalModule) {
      console.error("Excalidraw is not loaded.");
      return;
    }
    const serialized = excalModule.serializeAsJSON(elements, appState);
    onUpdateContent(serialized);
  };

  const ExcalidrawComponent = excalModule ? excalModule.default : null;

  return (
    <div className="width-full" key={context.path} style={{ height: "100vh" }}>
      {ExcalidrawComponent && (
        <ExcalidrawComponent
          viewModeEnabled={!isEditable}
          initialData={JSON.parse(content)}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
