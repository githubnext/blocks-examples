import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { FileBlockProps } from "@githubnext/utils";
import { useMemo } from "react";
import "styled-components";
import styles from "./style.css"

export default (props: FileBlockProps) => {

  const files = useMemo(() => ({
    "/App.js": getAppCode(props),
    "/style.css": styles
  }), [props.content])

  return (
    <div style={{
      width: "100%",
      height: "100%",
    }}>
      <SandpackProvider
        template="react"
        customSetup={{
          dependencies: {
            "@mdx-js/runtime": "^2.0.0-next.9",
            "@primer/components": "^31.1.0",
            "react-syntax-highlighter": "^15.4.4",
            "styled-components": "^5.3.3",
            "@githubnext/utils": "^0.13.1",
            "lz-string": "^1.4.4",
          },
          files: files
        }}
        autorun
      >
        <SandpackPreview
          // showOpenInCodeSandbox={false}
          showRefreshButton={false}
        />
      </SandpackProvider>
    </div>
  )
}


const getAppCode = (props: FileBlockProps) => (
  `import MDX from "@mdx-js/runtime";
import { Avatar, Box, StateLabel } from "@primer/components";
import "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { useTailwindCdn } from "@githubnext/utils";
import LZString from "lz-string"

import {
  ReactNode,
  createContext,
  useContext,
  useEffect, useMemo, useState,
  Component
} from "react";
import "./style.css";

export const MarkdownContext = createContext({
  issues: [],
  releases: [],
  commits: [],
});
export default function App(props) {
  const { context, content } = ${JSON.stringify(props)}
  useTailwindCdn()

  const [repoInfo, setRepoInfo] = useState({
    issues: [],
    releases: [],
    commits: [],
  });

  const sanitizedContent = useMemo(() => (
    content
  ), [content])

  const getRepoInfo = async () => {
    const issuesUrl = \`https://api.github.com/repos/\${context.owner}/\${context.repo}/issues\`;
    const issuesRes = await fetch(issuesUrl);
    const issues = await issuesRes.json();

    const releasesUrl = \`https://api.github.com/repos/\${context.owner}/\${context.repo}/releases\`;
    const releasesRes = await fetch(releasesUrl);
    const releases = await releasesRes.json();

    const commitsUrl = \`https://api.github.com/repos/\${context.owner}/\${context.repo}/commits\`;
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
      <div className="w-full h-full flex items-stretch overflow-hidden">
        <div className="flex-1 markdown-body p-6 pb-40 overflow-y-auto whitespace-pre-wrap">
          <div className="max-w-[60em] mx-auto">
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
  // CodeSandbox,
  code({ inline, className, children }) {
    const match = /language-(\\w+)/.exec(className || "");
    return !inline && match ? (
      <div className="code">
        <SyntaxHighlighter language={match[1]}>
          {String(children).replace(/\\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={className}>{children}</code>
    );
  },
  a: Link
};

function Link(props) {
  const videoExtensions = /\\.(mp4|webm|ogv|mov|flv|wmv|avi|m4v|mpg|mpeg|3gp|3g2)$/i;
  const isVideo = videoExtensions.test(props.href);

  if (isVideo) return (
    <video controls>
      <source src={props.href} />
    </video>
  )

  return (
    <a
      {...props}
    >
      {props.children}
    </a>
  )
}

const formatDate = (d) => d.toLocaleDateString();
const issueStateToStatusMap = {
  closed: "issueClosed",
  open: "issueOpened",
};
function Issues({ num = 3 }) {
  const { issues } = useContext(MarkdownContext);
  const filteredIssues = issues.slice(0, num);

  if (!filteredIssues.length) {
    return <div className="w-full h-10 items-center justify-center italic text-center pt-2 text-gray-500">
      No issues found
    </div>
  }

  return (
    <div className="mt-3 mb-6">
      <div className="flex space-x-2 flex-wrap">
        {filteredIssues.map((issue) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={issue.id}
            className="relative flex-1 min-w-[19em] m-1"
          >
            <div className="flex justify-between items-start">
              <a className="block !text-black" href={issue.html_url}>
                {issue.title}
              </a>
              <StateLabel
                // @ts-ignore
                status={issueStateToStatusMap[issue.state] || ""}
                variant="small"
                className=""
              >
                {issue.state}
              </StateLabel>
            </div>
            <div className="mt-1 text-sm italic text-gray-600">
              Last update {formatDate(new Date(issue.updated_at))}
            </div>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
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
    return <div className="w-full h-10 items-center justify-center italic text-center pt-2 text-gray-500">
      No releases found
    </div>
  }

  return (
    <div className="mt-3 mb-6">
      <div className="flex space-x-2 flex-wrap">
        {filteredReleases.map((release) => (
          <Box
            bg="canvas.subtle"
            p={3}
            key={release.id}
            className="relative flex-1 min-w-[19em] m-1"
          >
            <div className="flex justify-between items-center">
              <a className="block !text-black" href={release.html_url}>
                {release.tag_name}
              </a>
            </div>
            <div className="mt-1 text-sm italic text-gray-600">
              {formatDate(new Date(release.published_at))}
            </div>
            {/* <MDX className="whitespace-pre-wrap truncate">{issue.body}</MDX> */}
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
    return <div className="w-full h-10 items-center justify-center italic text-center pt-2 text-gray-500">
      No commits found
    </div>
  }

  return (
    <div className="mt-3 mb-6">
      <div className="flex flex-wrap">
        {filteredCommits.map((commit) => (
          <Box
            p={3}
            key={commit.sha}
            className="relative flex-1 min-w-[19em] m-1 bg-gray-100"
          >
            <div className="flex justify-between items-center">
              <a className="block !text-black" href={commit.html_url}>
                {commit.commit.message}
              </a>
            </div>
            {/* author */}
            <Box className="flex items-center mt-3">
              <Avatar src={commit.author.avatar_url} className="mr-2" />
              <div className="flex-1 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {commit.author.login}
                </div>
                <div className="mt-1 text-sm italic text-gray-600">
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

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    // console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col">

          <h1>Something went wrong.</h1>
          <p>
            {/* @ts-ignore */}
            {this.state.errorMessage || ""}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const optionsDefaults = {
  fontsize: "14",
  hidenavigation: "1",
  codemirror: "1",
  hidedevtools: "1",
}
export const CodeSandbox = ({
  children,
  height = "20em",
  sandboxOptions = {},
  dependencies,
}) => {
  const [url, setUrl] = useState("");
  const parameters = getParameters({
    files: {
      "index.js": {
        content: children?.props?.children?.props?.children,
        isBinary: false,
      },
      "package.json": {
        content: JSON.stringify({
          dependencies: parseDependencies(dependencies),
        }),
        isBinary: false,
      },
    },
  });

  const getSandboxUrl = async () => {
    const url = \`https://codesandbox.io/api/v1/sandboxes/define?parameters=\${parameters}&json=1\`;
    const res = await fetch(url);
    const data = await res.json();
    const id = data?.sandbox_id;
    const params = new URLSearchParams({ ...optionsDefaults, ...sandboxOptions }).toString()
    const iframeUrl = \`https://codesandbox.io/embed/\${id}?\${params}\`;

    setUrl(iframeUrl);
  };
  useEffect(() => {
    getSandboxUrl();
  }, []);

  return (
    <div className="w-full h-full mt-3 mb-10">
      {!!url && (
        <iframe
          className="w-full outline-none"
          style={{
            height
          }}
          src={url}
          title="CodeSandbox"
          sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
        />
      )}
    </div>
  );
};

const parseDependencies = dependencies => {
  let res = {};
  dependencies.forEach((dep) => {
    const [name, version = "latest"] = dep.split("@");
    res[name] = version;
  });
  return res;
};

// ported from "codesandbox/lib/api/define"
function compress(input) {
  return LZString.compressToBase64(input)
    .replace(/\\+/g, "-") // Convert '+' to '-'
    .replace(/\\//g, "_") // Convert '/' to '_'
    .replace(/=+$/, ""); // Remove ending '='
}
function getParameters(parameters) {
  return compress(JSON.stringify(parameters));
}
`
)