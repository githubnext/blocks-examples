import { tw } from "twind";
import { FileBlockProps } from "@githubnext/blocks";
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
  const [version, setVersion] = useState<number | null>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((imp) => {
      setExcalModule(imp);
      try {
        const parsed = JSON.parse(content);
        const elements = parsed?.elements || [];
        setVersion(imp.getSceneVersion(elements));
      } catch {}
    });
  }, []);

  const handleChange = (elements: any, appState: any) => {
    if (!excalModule) {
      console.error("Excalidraw is not loaded.");
      return;
    }
    const newVersion = excalModule.getSceneVersion(elements);
    const serialized = excalModule.serializeAsJSON(elements, appState);
    if (newVersion === version) return;
    onUpdateContent(serialized);
  };

  const ExcalidrawComponent = excalModule ? excalModule.default : null;

  return (
    <div
      className={tw(`width-full`)}
      key={context.path}
      style={{ height: "100vh" }}
    >
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
