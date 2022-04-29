import { tw } from "twind";
import { useEffect, useState } from "react";
import axios from "axios";
import SyntaxHighlighter from "react-syntax-highlighter";
import { FileBlockProps, getLanguageFromFilename } from "@githubnext/utils";
import "./index.css";

export default function (props: FileBlockProps) {
  const { content, context } = props;
  const [sections, setSections] = useState<CodeSection[]>([]);
  const [sectionExplanations, setSectionExplanations] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const language = getLanguageFromFilename(context.path.split("/").pop() || "");

  const updateSections = async () => {
    let sections = [] as CodeSection[];
    try {
      sections = await breakCodeIntoSections(content, language);
    } catch {
    } finally {
      if (!sections.length) {
        // make sure we at least have the whole file
        sections = [
          {
            type: "string",
            text: content,
          },
        ];
      }
    }
    setSections(sections);
    setSectionExplanations([]);
    sections.forEach(async (section, index) => {
      const { type, text } = section;
      const explanation =
        type === "function" &&
        // don't hammer the endpoint
        index < 30
          ? await fetchCodeSummary(text, language)
          : "";
      setSectionExplanations((sectionExplanations) => {
        let newSectionExplanations = [...sectionExplanations];
        newSectionExplanations[index] = explanation;
        return newSectionExplanations;
      });
    });
  };
  useEffect(() => {
    updateSections();
  }, [content]);

  return (
    <div className={tw(`h-full w-full relative`)}>
      <button
        className={tw(
          `btn flex items-center position-absolute top-2 right-2 z-10`
        )}
        onClick={() => {
          setIsCollapsed(!isCollapsed);
        }}
      >
        {isCollapsed ? (
          <>
            <svg
              className={tw(`inline-block mr-1 -ml-1`)}
              viewBox="0 0 16 16"
              width="16"
              height="16"
            >
              <path d="M8.177.677l2.896 2.896a.25.25 0 01-.177.427H8.75v1.25a.75.75 0 01-1.5 0V4H5.104a.25.25 0 01-.177-.427L7.823.677a.25.25 0 01.354 0zM7.25 10.75a.75.75 0 011.5 0V12h2.146a.25.25 0 01.177.427l-2.896 2.896a.25.25 0 01-.354 0l-2.896-2.896A.25.25 0 015.104 12H7.25v-1.25zm-5-2a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5zM6 8a.75.75 0 01-.75.75h-.5a.75.75 0 010-1.5h.5A.75.75 0 016 8zm2.25.75a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5zM12 8a.75.75 0 01-.75.75h-.5a.75.75 0 010-1.5h.5A.75.75 0 0112 8zm2.25.75a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5z"></path>
            </svg>
            Expand sections
          </>
        ) : (
          <>
            <svg
              className={tw(`inline-block mr-1 -ml-1`)}
              viewBox="0 0 16 16"
              width="16"
              height="16"
            >
              <path d="M10.896 2H8.75V.75a.75.75 0 00-1.5 0V2H5.104a.25.25 0 00-.177.427l2.896 2.896a.25.25 0 00.354 0l2.896-2.896A.25.25 0 0010.896 2zM8.75 15.25a.75.75 0 01-1.5 0V14H5.104a.25.25 0 01-.177-.427l2.896-2.896a.25.25 0 01.354 0l2.896 2.896a.25.25 0 01-.177.427H8.75v1.25zm-6.5-6.5a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5zM6 8a.75.75 0 01-.75.75h-.5a.75.75 0 010-1.5h.5A.75.75 0 016 8zm2.25.75a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5zM12 8a.75.75 0 01-.75.75h-.5a.75.75 0 010-1.5h.5A.75.75 0 0112 8zm2.25.75a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5z"></path>
            </svg>
            Collapse sections
          </>
        )}
      </button>
      <div
        className={tw(
          `h-full w-full d-flex flex-column bg-gray-50 overflow-auto`
        )}
      >
        {/* <p className={`px-6 pt-3 whitespace-pre-wrap ${fileSummary ? "" : "text-gray-400"}`}>
        Briefly, this code will {fileSummary || "..."}
        </p> */}
        <pre className={tw(`divide-y divide-gray-200 text-left`)}>
          {!sections.length && (
            <div className={tw(`text-center text-gray-500 italic py-10`)}>
              Loading...
            </div>
          )}
          {sections.map(({ text, name }, i) => (
            <Section
              key={i}
              text={text}
              name={name}
              language={language}
              explanation={sectionExplanations[i]}
              isCollapsed={isCollapsed}
            />
          ))}
        </pre>
      </div>
    </div>
  );
}

const syntaxHighlighterLanguageMap = {
  JavaScript: "javascript",
  TypeScript: "typescript",
} as Record<string, string>;
const Section = ({
  text,
  name,
  explanation,
  language,
  isCollapsed,
}: {
  text: string;
  name?: string;
  language: string;
  explanation: string | undefined;
  isCollapsed: boolean;
}) => {
  const [isCollapsedLocally, setIsCollapsedLocally] = useState(isCollapsed);
  useEffect(() => {
    setIsCollapsedLocally(isCollapsed);
  }, [isCollapsed]);

  const hasValidName =
    !!name &&
    !name.includes(" ") &&
    name !== "()" &&
    (explanation === undefined || !!explanation?.length);

  return (
    <div
      className={`hover:bg-white whitespace-pre-wrap grid grid-cols-[2fr,1fr] min-h-[3em] ${
        isCollapsedLocally ? "cursor-pointer" : ""
      }`}
      // click to expand, but don't act as a button when expanded, for easier text selection
      tabIndex={isCollapsedLocally ? 0 : 1}
      onClick={() => {
        if (!isCollapsedLocally) return;
        setIsCollapsedLocally(!isCollapsedLocally);
      }}
    >
      <div className={tw(`relative overflow-hidden border-r border-gray-200`)}>
        <div
          className={`px-5 py-3 text-base overflow-x-auto !bg-transparent top-0 ${
            isCollapsedLocally ? "absolute" : ""
          }`}
        >
          <SyntaxHighlighter
            language={syntaxHighlighterLanguageMap[language] || "javascript"}
            useInlineStyles={false}
            showLineNumbers={false}
            lineNumberStyle={{ opacity: 0.45 }}
            className={tw(`!bg-transparent`)}
            wrapLines
            wrapLongLines
          >
            {text.trim()}
          </SyntaxHighlighter>
        </div>
        {isCollapsedLocally && (
          // fade out to bottom
          <div
            className={tw(
              `absolute bottom-0 left-0 right-0 h-[3em] bg-gradient-to-b from-transparent to-gray-50 hover:to-white z-10`
            )}
          />
        )}
      </div>
      <div
        className={tw(`px-5 py-3 text-gray-800 text-sm font-sans min-h-[5em]`)}
      >
        {hasValidName && (
          <div
            className={tw(`font-mono text-xs font-medium mb-1 text-gray-500`)}
          >
            {name}
          </div>
        )}
        {explanation === undefined ? (
          <div className={tw(`text-gray-300 italic`)}>Loading...</div>
        ) : (
          <div className={tw(``)}>{explanation || ""}</div>
        )}
      </div>
    </div>
  );
};

const fetchCodeSummary = async (code: string, language: string) => {
  // this is an endpoint on the main prototype
  const response = await axios("/api/explain", {
    method: "POST",
    data: {
      language,
      code,
      prompt: `\n\nIn one sentence, the function will`,
      stop: ["<eos>", "#", "\n=", "\n\n"],
    },
  });
  const text = response.data
    // take out starting & trailing newlines
    .replace(/^\s+|\s+$/g, "");
  if (text.endsWith(":")) return "";
  return text;
};

type CodeSection = {
  type: "function" | "string";
  text: string;
  name?: string;
};
type FunctionResponse = {
  type: "function" | "string";
  position: [number, number];
  name?: string;
};
// break code string up into separate functions
const breakCodeIntoSections = async (
  code: string,
  language: string
): Promise<CodeSection[]> => {
  // this is an endpoint on the main prototype
  const res = await axios(`/api/code-chunk`, {
    method: "POST",
    data: {
      code,
      language,
    },
  });
  const functions = res.data.structure as FunctionResponse[];
  if (!functions?.length)
    return [
      {
        type: "string",
        text: code,
      },
    ];
  const sections = [] as CodeSection[];
  let runningIndex = 0;
  functions.forEach(({ position, name }) => {
    const runningText = code.slice(runningIndex, position[0]);

    // the way we split out sections misses "prefixes" like `export function X() {}`
    // let's check for those at the end of the previous section and add them to the current one
    const prefixesToInclude = ["export", "export default"];
    if (prefixesToInclude.includes(runningText.trim())) {
      position[0] -= runningText.length;
    } else if (
      prefixesToInclude.some((prefix) => runningText.trim().endsWith(prefix))
    ) {
      const match = prefixesToInclude.find((prefix) =>
        runningText.trim().endsWith(prefix)
      );

      // trim newlines to preserve vertical space
      // sections are separated by divider lines, anyway
      const numberOfWhitespaces =
        runningText.length - runningText.trimEnd().length;
      position[0] -= (match?.length || 0) + numberOfWhitespaces;

      sections.push({
        type: "string",
        text: code.slice(runningIndex, position[0]),
      });
    } else if (runningText.length) {
      sections.push({
        type: "string",
        text: code.slice(runningIndex, position[0]),
      });
    }
    runningIndex = position[1];
    sections.push({
      type: "function",
      text: code.slice(position[0], position[1]),
      name,
    });
  });
  return sections.filter((d) => !!d.text.trim());
};
