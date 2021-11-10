import "./style.css"
import SyntaxHighlighter from "react-syntax-highlighter";

export function Viewer(props: FileViewerProps) {
  const { content, meta } = props;

  return (
    <div className="code">
      <SyntaxHighlighter
        language={meta.language}
        useInlineStyles={false}
        showLineNumbers
        lineNumberStyle={{ opacity: 0.45 }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
