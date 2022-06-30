import { tw } from "twind";
import { FileBlockProps, getLanguageFromFilename } from "@githubnext/blocks";
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
  const onFetchInternalEndpoint =
    props.private__onFetchInternalEndpoint || onFetchInternalEndpointPolyfill;

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
      className={
        "wrapper" + tw(`h-full w-full relative grid grid-cols-2 gap-2`)
      }
    >
      <form
        className={`relative px-5 py-2 flex flex-col justify-end ${
          isLoading ? "opacity-50 cursor-default" : ""
        }`}
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          const res = await onFetchInternalEndpoint("/api/openai-edit", {
            method: "POST",
            data: {
              instruction: instruction,
              input: content,
            },
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
              className={tw(`ml-1 self-stretch`)}
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
            <Button
              variant="primary"
              onClick={() => {
                onUpdateContent(newContent);
              }}
            >
              Save changes
            </Button>
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
        className={`${tw("bg-transparent")} ${
          {
            delete: tw("!bg-[#FFEBE9]"),
            insert: tw("!bg-[#F5F6F8]"),
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
        className={`${tw("bg-transparent")} ${
          {
            delete: tw("!bg-[#F5F6F8]"),
            insert: tw("!bg-[#E6FFEC]"),
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

const onFetchInternalEndpointPolyfill = async (url: string, params: any) => {
  return await axios(url, params);
};
