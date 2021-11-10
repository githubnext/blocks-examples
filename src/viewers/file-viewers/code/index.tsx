import "./style.css"
import SyntaxHighlighter from "react-syntax-highlighter";

export function Viewer(props: FileViewerProps) {
  const { content } = props;

  return (
    <div className="code">
      <SyntaxHighlighter
        // TODO: pass in language here with a utility function
        language={''}
        useInlineStyles={false}
        showLineNumbers
        lineNumberStyle={{ opacity: 0.45 }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
