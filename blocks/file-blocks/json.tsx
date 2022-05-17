import { FileBlockProps } from "@githubnext/blocks";
import { useMemo } from "react";
import ReactJson from "react-json-view";
import type { InteractionProps } from "react-json-view";
import jsYaml from "js-yaml";

export default function (props: FileBlockProps) {
  const { content, context, isEditable, onUpdateContent } = props;

  const extension = context.path.split(".").pop() || "";
  const isYaml = ["yaml", "yml"].includes(extension);

  const setModifiedContent = (data: unknown) => {
    const contentString = isYaml
      ? jsYaml.dump(data)
      : JSON.stringify(data, null, 2);
    onUpdateContent(contentString);
  };

  const data = useMemo(() => {
    try {
      if (isYaml) {
        try {
          return jsYaml.load(content);
        } catch (e) {}
      }
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }, [content]);

  const onChange = isEditable
    ? (e: InteractionProps) => setModifiedContent(e.updated_src)
    : undefined;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      {data ? (
        <>
          <ReactJson
            src={data}
            name={false}
            displayDataTypes={false}
            collapsed={2}
            theme={theme}
            iconStyle="circle"
            quotesOnKeys={false}
            style={{
              fontSize: "1.2em",
              lineHeight: "1.2em",
              padding: "2em",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              border: "none",
              backgroundColor: "transparent",
              color: "#333",
            }}
            onEdit={onChange}
            onAdd={onChange}
            onDelete={onChange}
          />
        </>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#999",
            padding: "0 2em",
            fontStyle: "italic",
          }}
        >
          We couldn't parse that file. Try checking the Code Block view.
        </div>
      )}
    </div>
  );
}

const theme = {
  base00: "white",
  base01: "#cbd5e1",
  base02: "#e2e8f0",
  base03: "#475569",
  base04: "#d1d5db",
  base05: "#475569",
  base06: "#475569",
  base07: "#475569",
  base08: "#14b8a6",
  base09: "#6366f1",
  base0A: "#a855f7",
  base0B: "#db2777",
  base0C: "#ea580c",
  base0D: "#64748b",
  base0E: "#0891b2",
  base0F: "#0d9488",
};
