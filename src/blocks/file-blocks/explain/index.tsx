import { FileBlockProps, getLanguageFromFilename } from "@githubnext/utils";
import { ThemeProvider } from "@primer/react";
import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import SyntaxHighlighter from "react-syntax-highlighter";
import { ExplanationComponent } from "./explanation";
import { useCopyToClipboard } from "react-use";
import "./index.css";
import { LineMenu } from "./line-menu";

const syntaxHighlighterLanguageMap = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Ruby: "ruby",
  Python: "python",
} as Record<string, string>;

export interface Explanation {
  code: string;
  start: number;
  end: number;
}

function BlockInner(props: FileBlockProps) {
  const [value, copy] = useCopyToClipboard();
  const { context, content } = props;

  const language = Boolean(context.path)
    ? getLanguageFromFilename(context.path)
    : "N/A";

  const [start, setStart] = useState<number>();
  const [end, setEnd] = useState<number>();
  const [explanations, setExplanations] = useState<Record<number, Explanation>>(
    {}
  );

  const handleLineClick = (line: number, shift: boolean) => {
    if (!shift) {
      setStart(line);
      setEnd(line);
    }

    if (shift && !start) {
      return;
    }

    if (shift && start) {
      if (start < line) {
        setEnd(line);
      } else {
        setStart(line);
        setEnd(start);
      }
    }
  };

  const handleExplain = useCallback(() => {
    if (!start) return;
    let startIdx = start;
    let endIdx = end || startIdx;

    const lineContent = content
      .split("\n")
      .slice(startIdx - 1, endIdx)
      .join("\n");

    setExplanations((curr) => {
      curr[start] = {
        code: lineContent,
        start: start,
        end: endIdx,
      };
      return curr;
    });

    setStart(undefined);
    setEnd(undefined);
  }, [start, end, setExplanations, content, setStart, setEnd]);

  const handleCopy = useCallback(() => {
    if (!start) return;
    let startIdx = start;
    let endIdx = end || startIdx;

    const lineContent = content
      .split("\n")
      .slice(startIdx - 1, endIdx)
      .join("\n");

    copy(lineContent);
  }, [content, start, end]);

  const handleCopyPermalink = useCallback(() => {
    if (!start) return;
    let startIdx = start;
    let endIdx = end || startIdx;
    copy(
      `https://github.com/${context.owner}/${context.repo}/blob/${context.sha}/${context.path}#L${startIdx}-L${endIdx}`
    );
  }, [content, context, start, end]);

  return (
    <div className="py-4 h-full">
      <div className="max-w-6xl h-full px-4 mx-auto overflow-hidden">
        <div className="border relative h-full">
          {start && end && (
            <div
              className="z-20 absolute"
              style={{ top: (start - 1) * 21 - 2, left: -20 }}
            >
              <LineMenu
                start={start}
                end={end}
                onCopy={handleCopy}
                onCopyPermalink={handleCopyPermalink}
                onExplain={handleExplain}
              />
            </div>
          )}
          <div className="flex w-full">
            <div className="flex-1">
              <SyntaxHighlighter
                language={
                  syntaxHighlighterLanguageMap[language] || "javascript"
                }
                useInlineStyles={false}
                wrapLines
                className="!bg-transparent syntax-highlighter-block overflow-auto"
                lineProps={(lineNumber) => {
                  const isHighlighted =
                    start && end && lineNumber >= start && lineNumber <= end;
                  return {
                    "data-highlighted": isHighlighted,
                    onClick: (
                      e: React.MouseEvent<HTMLLIElement, MouseEvent>
                    ) => {
                      let clicked = e.target as HTMLElement;
                      if (!clicked.classList.contains("comment")) return;
                      handleLineClick(lineNumber, e.shiftKey);
                    },
                    style: {
                      display: "block",
                    },
                  };
                }}
                showLineNumbers
              >
                {content}
              </SyntaxHighlighter>
            </div>
            <div className="basis-52 flex-grow-0 flex-shrink-0 relative">
              {Object.entries(explanations).map(([line, explanation]) => {
                return (
                  <div
                    key={line}
                    className="px-3 overflow-y-auto break-all absolute left-0 w-full bg-white"
                    style={{
                      top: (explanation.start - 1) * 21 - 2,
                      height: (explanation.end - explanation.start + 1) * 21,
                      right: 0,
                      boxShadow: `-2px 0 0 0 #539bf5, inset 1px 0 0 0 #539bf5, -24px 0px 16px -11px rgba(0,0,0,0.05)`,
                      gridColumn: 1,
                      gridRow: `${explanation.start}/${explanation.end + 1}`,
                    }}
                  >
                    <ExplanationComponent
                      language={language}
                      explanation={explanation}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function (props: FileBlockProps) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BlockInner {...props} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
