import { FileBlockProps, getLanguageFromFilename } from "@githubnext/utils";
import { ThemeProvider } from "@primer/react";
import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { getHighlighter, setCDN } from "shiki";
import { ExplanationComponent } from "./explanation";
import "./index.css";
import { Line } from "./line";
import { LineMenu } from "./line-menu";
import { LoadingState } from "./loading-state";

setCDN("https://unpkg.com/shiki/");

export interface Explanation {
  code: string;
  start: number;
  end: number;
}

async function highlightCode(code: string, language: string) {
  const highlighter = await getHighlighter({
    theme: "github-light",
    langs: ["js", "javascript"],
  });
  return highlighter.codeToThemedTokens(code, "js");
}

function BlockInner(props: FileBlockProps) {
  const { context, content } = props;

  const language = Boolean(context.path)
    ? getLanguageFromFilename(context.path)
    : "N/A";

  const { data, status } = useQuery(
    ["code", context.file, content],
    () => highlightCode(content, language),
    {
      refetchOnWindowFocus: false,
    }
  );

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

    const relevantTokens = data?.slice(startIdx - 1, endIdx);
    if (!relevantTokens) return;
    const tokensContent = relevantTokens
      .map((token) => token.map((t) => t.content).join(""))
      .join("\n");

    setExplanations((curr) => {
      curr[start] = {
        code: tokensContent,
        start: start,
        end: endIdx,
      };
      return curr;
    });

    setStart(undefined);
    setEnd(undefined);
  }, [start, end, setExplanations, data, setStart, setEnd]);

  const borderColor = `rgba(0, 0, 0, .1)`;

  return (
    <div className="py-4">
      <div className="max-w-6xl px-8 mx-auto overflow-hidden">
        <div style={{ border: `1px solid ${borderColor}` }}>
          {status === "loading" && <LoadingState content={content} />}
          {status === "success" && data && (
            <div className="grid grid-cols-[1fr_300px] relative">
              {start && end && (
                <div
                  className="z-10 absolute"
                  style={{ top: (start - 1) * 20 - 4, left: -15 }}
                >
                  <LineMenu onExplain={handleExplain} />
                </div>
              )}

              <div className="min-w-0 overflow-auto">
                {data.map((token, index) => {
                  const lineNum = index + 1;
                  const isHighlighted =
                    start && end ? lineNum >= start && lineNum <= end : false;
                  const hasLineMenu = isHighlighted && start === lineNum;

                  return (
                    <Line
                      number={lineNum}
                      isHighlighted={isHighlighted}
                      hasLineMenu={hasLineMenu}
                      token={token}
                      key={index}
                      onSelect={handleLineClick}
                    />
                  );
                })}
              </div>
              <div>
                <div
                  className="grid h-full"
                  style={{
                    gridTemplateRows: `repeat(${data.length}, 20px)`,
                  }}
                >
                  {Object.entries(explanations).map(([line, explanation]) => {
                    return (
                      <div
                        key={line}
                        className="pl-3 pr-2 overflow-y-auto"
                        style={{
                          boxShadow: `-2px 0 0 0 #539bf5, inset 1px 0 0 0 #539bf5`,
                          gridColumn: 1,
                          gridRow: `${explanation.start}/${
                            explanation.end + 1
                          }`,
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
          )}
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
