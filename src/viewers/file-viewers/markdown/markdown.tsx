import "./viewers/file-viewers/markdown/style.css"
import SyntaxHighlighter from "react-syntax-highlighter";

export function Viewer(props: FileViewerProps) {
  const { content } = props;

  return (
    <div className="code">
      <SyntaxHighlighter
        // TODO: pass in language here with a utility function
        language={'markdown'}
        useInlineStyles={false}
        showLineNumbers={false}
        lineNumberStyle={{ opacity: 0.45 }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
