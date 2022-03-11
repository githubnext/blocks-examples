import "./style.css";
import SyntaxHighlighter from "react-syntax-highlighter";
import { FileBlockProps } from "@githubnext/utils";

function languageOfExtension(extension?: string) {
  switch (extension) {
    case undefined:
      return "text";
    case "jsx":
      return "javascript";
    case "tsx":
      return "typescript";
    default:
      return extension;
  }
}

export default function (props: FileBlockProps) {
  const {
    content,
    context: { path },
  } = props;

  const extension = path.includes(".") ? path.split(".").pop() : undefined;
  const language = languageOfExtension(extension);

  return (
    <div className="code">
      <SyntaxHighlighter
        language={language}
        useInlineStyles={false}
        showLineNumbers
        lineNumberStyle={{ opacity: 0.45 }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}
