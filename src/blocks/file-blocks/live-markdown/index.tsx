import { tw } from "twind";
import { FileBlockProps } from "@githubnext/utils";
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
  const { context, content } = props;

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
const components = {
  Issues,
  Releases,
  Commits,
  CodeSandbox,
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
};

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
  const filteredIssues = issues.slice(0, num);

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
  const filteredReleases = releases.slice(0, num);

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
  const filteredCommits = commits.slice(0, num);

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
