import { tw } from "twind";
import { FileBlockProps, getLanguageFromFilename } from "@githubnext/utils";
import { RocketIcon } from "@primer/octicons-react";
import axios from "axios";
import { useMemo, useState } from "react";
import { Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import SyntaxHighlighter from "react-syntax-highlighter";
import { diffAsText } from "unidiff";
import "./index.css";
import { Button, FormControl, TextInput } from "@primer/react";

export default function (props: FileBlockProps) {
  const { content, context, onUpdateContent } = props;

  const [instruction, setInstruction] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const language = getLanguageFromFilename(context.path.split("/").pop() || "");

  const hunks = useMemo(() => {
    if (!newContent) return [];
    const hunks = parseDiff(
      diffAsText(content, newContent, {
        context: 100,
      }),
      {
        nearbySequences: "zip",
      }
    );

    return hunks;
  }, [content, newContent]);

  return (
    <div
      id="example-block-summarize-block"
      className={tw(
        `h-full w-full relative grid grid-cols-2 gap-2 grid-rows-[7em,1fr]`
      )}
    >
      <form
        className={`relative px-5 py-2 flex flex-col justify-end ${
          isLoading ? "opacity-50 cursor-default" : ""
        }`}
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          const res = await axios.post("/api/openai-edit", {
            instruction: instruction,
            input: content,
          });
          setNewContent(res.data);
          setIsLoading(false);
        }}
      >
        <div className={tw(`flex items-end mt-1`)}>
          <FormControl>
            <FormControl.Label>
              How would you like to edit the code?
            </FormControl.Label>
            <TextInput
              value={instruction}
              disabled={isLoading}
              onChange={(e) => {
                setInstruction(e.target.value);
              }}
            />
          </FormControl>

          <div>
            <Button
              trailingIcon={RocketIcon}
              disabled={isLoading}
              className={tw(`btn ml-1 self-stretch`)}
            >
              {newContent ? "Re-generate modified code" : "Get modified code"}
            </Button>
          </div>
        </div>
      </form>

      <div className={tw(`flex items-end px-5 py-2`)}>
        {newContent && (
          <div className={tw(`w-full flex justify-between`)}>
            <div className={tw(`text-gray-500`)}>Proposed code</div>
            <button
              className={tw(`btn btn-primary`)}
              onClick={() => {
                onUpdateContent(newContent);
              }}
            >
              Save changes
            </button>
          </div>
        )}
      </div>

      {newContent ? (
        <div className={tw(`col-span-2`)}>
          <div className={tw(`w-full`)}>
            {hunks?.[0]?.hunks?.map((hunk: Hunk) => (
              <HunkComponent
                key={hunk.content}
                hunk={hunk}
                language={language}
              />
            ))}
          </div>
        </div>
      ) : (
        <pre className={tw(`px-5 py-3 text-left`)}>
          <SyntaxHighlighter
            language={syntaxHighlighterLanguageMap[language] || "javascript"}
            useInlineStyles={false}
            showLineNumbers={false}
            lineNumberStyle={{ opacity: 0.45 }}
            className={tw(`!bg-transparent`)}
            wrapLines
            wrapLongLines
          >
            {content}
          </SyntaxHighlighter>
        </pre>
      )}
    </div>
  );
}

const syntaxHighlighterLanguageMap = {
  JavaScript: "javascript",
  TypeScript: "typescript",
} as Record<string, string>;

const HunkComponent = ({ hunk, language }: { hunk: any; language: string }) => {
  return (
    <pre className={tw(`px-5 py-3 text-left`)}>
      {hunk.changes.map((change: Hunk["change"], i: number) => (
        <Change key={i} change={change} language={language} />
      ))}
    </pre>
  );
};

const Change = ({ change, language }: { change: Hunk; language: string }) => {
  return (
    <div className={tw(`grid grid-cols-2`)}>
      <SyntaxHighlighter
        language={syntaxHighlighterLanguageMap[language] || "javascript"}
        useInlineStyles={false}
        showLineNumbers={change.type !== "insert"}
        startingLineNumber={change.oldLineNumber || change.lineNumber}
        lineNumberStyle={{
          width: "3em",
          textAlign: "right",
          marginRight: "0.3em",
          color: change.type === "normal" ? "#6e7781" : "#24292f",
          background: change.type === "delete" ? "#FFD7D5" : "",
        }}
        className={`!bg-transparent ${
          {
            delete: "!bg-[#FFEBE9]",
            insert: "!bg-[#F5F6F8]",
          }[change.type as string] || ""
        }`}
        wrapLines
        wrapLongLines
      >
        {(change.type === "delete" ? "- " : "  ") +
          (change.type === "insert" ? " " : change.content || " ")}
      </SyntaxHighlighter>
      <SyntaxHighlighter
        language={syntaxHighlighterLanguageMap[language] || "javascript"}
        useInlineStyles={false}
        showLineNumbers={change.type !== "delete"}
        startingLineNumber={change.newLineNumber || change.lineNumber}
        lineNumberStyle={{
          width: "3em",
          textAlign: "right",
          marginRight: "0.3em",
          color: change.type === "normal" ? "#6e7781" : "#24292f",
          background: change.type === "insert" ? "#CCFFD8" : "",
        }}
        className={`!bg-transparent ${
          {
            delete: "!bg-[#F5F6F8]",
            insert: "!bg-[#E6FFEC]",
          }[change.type as string] || ""
        }`}
        wrapLines
        wrapLongLines
      >
        {(change.type === "insert" ? "+ " : "  ") +
          (change.type === "delete" ? " " : change.content || " ")}
      </SyntaxHighlighter>
    </div>
  );
};
