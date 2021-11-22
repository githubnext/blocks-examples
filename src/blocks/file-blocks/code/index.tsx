import "./style.css"
import SyntaxHighlighter from "react-syntax-highlighter";
import { FileBlockProps } from "@githubnext/utils";

export default function (props: FileBlockProps) {
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
