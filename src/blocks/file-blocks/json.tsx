import { FileBlockProps } from "@githubnext/utils";
import { useMemo } from "react";
import ReactJson from 'react-json-view'
import jsYaml from "js-yaml"

export default function (props: FileBlockProps) {
  const { content, context } = props;

  const data = useMemo(() => {
    try {
      const extension = context.path.split(".").pop()
      if (extension === "yml" || extension === "yaml") {
        try {
          return jsYaml.load(content)
        } catch (e) {
        }
      }
      return JSON.parse(content)
    } catch (e) {
      return null
    }
  }, [content])

  return (
    <div style={{
      width: "100%",
      height: "100%",
      overflow: "auto",
    }}>
      {data ? (
        <ReactJson
          src={data}
          name={false}
          displayDataTypes={false}
          collapsed={2}
          theme="shapeshifter:inverted"
          iconStyle="circle"
          style={{
            fontSize: "1.2em",
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
        />
      ) : (
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#999",
          padding: "0 2em",
          fontStyle: "italic",
        }}>
          We couldn't parse that file. Try checking the Code Block view.
        </div>
      )}
    </div>
  )
}
