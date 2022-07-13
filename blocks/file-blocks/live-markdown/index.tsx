import { tw } from "twind";
import { Block, FileBlockProps, FolderBlockProps } from "@githubnext/blocks";
// @ts-ignore
import MDX from "@mdx-js/runtime";
import { Avatar, Box, StateLabel } from "@primer/react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { CodeSandbox } from "./CodeSandbox";
import { ErrorBoundary } from "./ErrorBoundary";
import "./style.css";

type RepoInfo = {
  issues: any[];
  releases: any[];
  commits: any[];
};

export const MarkdownContext = createContext<RepoInfo>({
  issues: [],
  releases: [],
  commits: [],
});
export default function (props: FileBlockProps) {
  const { context, content, BlockComponent } = props;

  const [repoInfo, setRepoInfo] = useState<RepoInfo>({
    issues: [],
    releases: [],
    commits: [],
  });

  const sanitizedContent = useMemo(() => content, [content]);

  const getRepoInfo = async () => {
    const issuesUrl = `https://api.github.com/repos/${context.owner}/${context.repo}/issues`;
    const issuesRes = await fetch(issuesUrl);
    const issues = await issuesRes.json();

    const releasesUrl = `https://api.github.com/repos/${context.owner}/${context.repo}/releases`;
    const releasesRes = await fetch(releasesUrl);
    const releases = await releasesRes.json();

    const commitsUrl = `https://api.github.com/repos/${context.owner}/${context.repo}/commits`;
    const commitsRes = await fetch(commitsUrl);
    const commits = await commitsRes.json();
    const info = {
      issues: issues,
      releases: releases,
      commits: commits,
    };
    setRepoInfo(info);
  };

  useEffect(() => {
    getRepoInfo();
  }, []);

  const components = useMemo(
    () => ({
      Issues,
      Releases,
      Commits,
      CodeSandbox,
      BlockComponent: BlockComponentWrapper(BlockComponent),
      code({
        inline,
        className,
        children,
      }: {
        inline: boolean;
        className: string;
        children: any;
      }) {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
          <div className={tw(`code`)}>
            <SyntaxHighlighter language={match[1]}>
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          </div>
        ) : (
          <code className={className}>{children}</code>
        );
      },
      a: Link,
    }),
    [BlockComponent]
  );

  return (
    <MarkdownContext.Provider value={repoInfo} key={content}>
      <div className={tw(`w-full h-full flex items-stretch overflow-hidden`)}>
        <div
          className={tw(
            `flex-1 markdown-body p-6 pb-40 overflow-y-auto whitespace-pre-wrap`
          )}
        >
          <div className={tw(`max-w-[60em] mx-auto`)}>
            <ErrorBoundary key={content}>
              <MDX components={components} scope={repoInfo}>
                {sanitizedContent}
              </MDX>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </MarkdownContext.Provider>
  );
}

function Link(props: Record<string, any>) {
  const videoExtensions =
    /\.(mp4|webm|ogv|mov|flv|wmv|avi|m4v|mpg|mpeg|3gp|3g2)$/i;
  const isVideo = videoExtensions.test(props.href);

  if (isVideo)
    return (
      <video controls>
        <source src={props.href} />
      </video>
    );

  return (
    <a target="_blank" rel="noreferrer" {...props}>
      {props.children}
    </a>
  );
}

const formatDate = (d: Date) => d.toLocaleDateString();
const issueStateToStatusMap = {
  closed: "issueClosed",
  open: "issueOpened",
};
function Issues({ num = 3 }) {
  const { issues = [] } = useContext(MarkdownContext);
  const filteredIssues = issues?.slice?.(0, num) || [];

  if (!filteredIssues.length) {
    return (
      <div
        className={tw(
          `w-full h-10 items-center justify-center italic text-center pt-2 text-gray-500`
        )}
      >
        No issues found
      </div>
    );
  }

  return (
    <div className={tw(`mt-3 mb-6`)}>
      <div className={tw(`flex space-x-2 flex-wrap`)}>
        {filteredIssues.map((issue) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={issue.id}
            className={tw(`relative flex-1 min-w-[19em] m-1`)}
          >
            <div className={tw(`flex justify-between items-start`)}>
              <a className={tw(`block !text-black`)} href={issue.html_url}>
                {issue.title}
              </a>
              <StateLabel
                // @ts-ignore
                status={issueStateToStatusMap[issue.state] || ""}
                variant="small"
                className={tw(``)}
              >
                {issue.state}
              </StateLabel>
            </div>
            <div className={tw(`mt-1 text-sm italic text-gray-600`)}>
              Last update {formatDate(new Date(issue.updated_at))}
            </div>
            {/* <MDX className={tw(`whitespace-pre-wrap truncate`)}>{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  );
}
function Releases({ num = 3 }) {
  const { releases = [] } = useContext(MarkdownContext);
  const filteredReleases = releases?.slice?.(0, num) || [];

  if (!filteredReleases.length) {
    return (
      <div
        className={tw(
          `w-full h-10 items-center justify-center italic text-center pt-2 text-gray-500`
        )}
      >
        No releases found
      </div>
    );
  }

  return (
    <div className={tw(`mt-3 mb-6`)}>
      <div className={tw(`flex space-x-2 flex-wrap`)}>
        {filteredReleases.map((release) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={release.id}
            className={tw(`relative flex-1 min-w-[19em] m-1`)}
          >
            <div className={tw(`flex justify-between items-center`)}>
              <a className={tw(`block !text-black`)} href={release.html_url}>
                {release.tag_name}
              </a>
            </div>
            <div className={tw(`mt-1 text-sm italic text-gray-600`)}>
              {formatDate(new Date(release.published_at))}
            </div>
            {/* <MDX className={tw(`whitespace-pre-wrap truncate`)}>{issue.body}</MDX> */}
          </Box>
        ))}
      </div>
    </div>
  );
}
function Commits({ num = 2 }) {
  const { commits = [] } = useContext(MarkdownContext);
  const filteredCommits = commits?.slice?.(0, num) || [];

  if (!filteredCommits.length) {
    return (
      <div
        className={tw(
          `w-full h-10 items-center justify-center italic text-center pt-2 text-gray-500`
        )}
      >
        No commits found
      </div>
    );
  }

  return (
    <div className={tw(`mt-3 mb-6`)}>
      <div className={tw(`flex flex-wrap`)}>
        {filteredCommits.map((commit) => (
          <Box
            p={3}
            key={commit.sha}
            className={tw(`relative flex-1 min-w-[19em] m-1 bg-gray-100`)}
          >
            <div className={tw(`flex justify-between items-center`)}>
              <a className={tw(`block !text-black`)} href={commit.html_url}>
                {commit.commit.message}
              </a>
            </div>
            {/* author */}
            <Box className={tw(`flex items-center mt-3`)}>
              <Avatar src={commit.author.avatar_url} className={tw(`mr-2`)} />
              <div className={tw(`flex-1 flex items-center justify-between`)}>
                <div className={tw(`text-sm text-gray-600`)}>
                  {commit.author.login}
                </div>
                <div className={tw(`mt-1 text-sm italic text-gray-600`)}>
                  {formatDate(new Date(commit.commit.author.date))}
                </div>
              </div>
            </Box>
          </Box>
        ))}
      </div>
    </div>
  );
}

const BlockComponentWrapper =
  ({
    BlockComponent,
    parentContext,
  }: {
    BlockComponent: React.FC<FileBlockProps | FolderBlockProps>;
    parentContext: FileBlockProps["context"];
  }) =>
  (
    props: (FileBlockProps | FolderBlockProps) & {
      block: Block;
    }
  ) => {
    if (!props.block || !props.context)
      return (
        <div className={tw(`flex h-full w-full items-center justify-center`)}>
          <p>
            <strong>
              BlockComponent needs{" "}
              {!props.block ? "block" : !props.context ? "context" : ""}
            </strong>
          </p>
        </div>
      );

    const mergedContext = {
      ...parentContext,
      ...props.context,
    };

    const blockId = [props.block.owner, props.block.repo, props.block.id].join(
      "__"
    );

    return (
      <div className={tw(`mt-3 mb-6`)}>
        <Box
          className={tw(
            `flex items-center justify-between py-3 px-5 bg-slate-100`
          )}
          bg="canvas.subtle"
        >
          <div>
            <strong>
              {props.block.owner}/{props.block.repo}:{props.block.id}
            </strong>{" "}
            showing{" "}
            <code className="!ml-1 inline-block">
              {mergedContext.owner}/{mergedContext.repo}
            </code>
            :
            <code className="!ml-1 inline-block">
              {mergedContext.path || "/"}
            </code>
          </div>
          <Link
            href={`https://blocks.githubnext.com/${mergedContext.owner}/${
              mergedContext.repo
            }?path=${mergedContext.path || ""}&blockKey=${blockId}`}
            target="_blank"
            rel="noreferrer"
            className={tw(
              `text-sm !text-gray-600 hover:!text-gray-900 flex items-center`
            )}
          >
            See in context
            <svg
              viewBox="0 0 24 24"
              width="1em"
              className={tw(`ml-1 flex-none`)}
            >
              <path d="M15.5 2.25a.75.75 0 01.75-.75h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V4.06l-6.22 6.22a.75.75 0 11-1.06-1.06L19.94 3h-3.69a.75.75 0 01-.75-.75z"></path>
              <path d="M2.5 4.25c0-.966.784-1.75 1.75-1.75h8.5a.75.75 0 010 1.5h-8.5a.25.25 0 00-.25.25v15.5c0 .138.112.25.25.25h15.5a.25.25 0 00.25-.25v-8.5a.75.75 0 011.5 0v8.5a1.75 1.75 0 01-1.75 1.75H4.25a1.75 1.75 0 01-1.75-1.75V4.25z"></path>
            </svg>
          </Link>
        </Box>

        <Box className={tw(`h-[22em] overflow-auto border border-slate-100`)}>
          <BlockComponent {...props} />
        </Box>
      </div>
    );
  };
