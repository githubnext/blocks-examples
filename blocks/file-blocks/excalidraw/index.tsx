import { tw } from "twind";
import { FileBlockProps } from "@githubnext/blocks";
import { useEffect, useRef, useState } from "react";
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
  const version = useRef<number>(null);
  const key = useRef<number>(0);

  const parsedContent = JSON.parse(content);
  if (excalModule) {
    const newVersion = excalModule.getSceneVersion(parsedContent.elements);
    if (newVersion !== version.current) {
      version.current = newVersion;
      key.current += 1;
    }
  }

  useEffect(() => {
    if (excalModule) return;
    import("@excalidraw/excalidraw").then((imp) => {
      version.current = imp.getSceneVersion(parsedContent.elements);
      setExcalModule(imp);
    });
  }, []);

  const handleChange = (elements: any, appState: any) => {
    if (!excalModule) {
      console.error("Excalidraw is not loaded.");
      return;
    }
    const newVersion = excalModule.getSceneVersion(elements);
    if (newVersion === version.current) return;
    version.current = newVersion;
    const serialized = excalModule.serializeAsJSON(elements, appState);
    onUpdateContent(serialized);
  };

  const ExcalidrawComponent = excalModule ? excalModule.default : null;

  return (
    <div
      className={tw(`width-full`)}
      style={{ height: "100vh" }}
      key={context.sha}
    >
      {ExcalidrawComponent && (
        <ExcalidrawComponent
          key={String(key.current)}
          viewModeEnabled={!isEditable}
          initialData={parsedContent}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
