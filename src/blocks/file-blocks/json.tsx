import { FileBlockProps } from "@githubnext/utils";
import { useMemo } from "react";
import ReactJson from 'react-json-view'

export default function (props: FileBlockProps) {
  const { content } = props;

  const data = useMemo(() => {
    try {
      return JSON.parse(content)
    } catch (e) {
      return {}
    }
  }, [content])

  return (
    <div style={{
      width: "100%",
      height: "100%",
      overflow: "auto",
    }}>
      <ReactJson
        src={data}
        name={false}
        displayDataTypes={false}
        collapsed={1}
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
    </div>
  )
}
