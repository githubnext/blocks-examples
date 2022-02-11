import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { FileBlockProps } from "@githubnext/utils";
import { useMemo } from "react";
import "styled-components";
import "./style.css"

export default (props: FileBlockProps) => {

  const files = useMemo(() => ({
    "/App.js": getAppCode(props),
    "/styles.css": styles
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
          showOpenInCodeSandbox={false}
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
import "./styles.css";

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

// dropping in here until we figure out how to properly import this in the prototype
const styles = `.markdown-body {
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  margin: 0;
  color: #24292f;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body .octicon {
  display: inline-block;
  fill: currentColor;
  vertical-align: text-bottom;
}

.markdown-body h1:hover .anchor .octicon-link:before,
.markdown-body h2:hover .anchor .octicon-link:before,
.markdown-body h3:hover .anchor .octicon-link:before,
.markdown-body h4:hover .anchor .octicon-link:before,
.markdown-body h5:hover .anchor .octicon-link:before,
.markdown-body h6:hover .anchor .octicon-link:before {
  width: 16px;
  height: 16px;
  content: " ";
  display: inline-block;
  background-color: currentColor;
  -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
  mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
}

.markdown-body details,
.markdown-body figcaption,
.markdown-body figure {
  display: block;
}

.markdown-body summary {
  display: list-item;
}

.markdown-body a {
  background-color: transparent;
  color: #0969da;
  text-decoration: none;
}

.markdown-body a:active,
.markdown-body a:hover {
  outline-width: 0;
}

.markdown-body abbr[title] {
  border-bottom: none;
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}

.markdown-body b,
.markdown-body strong {
  font-weight: 600;
}

.markdown-body dfn {
  font-style: italic;
}

.markdown-body h1 {
  margin: 0.67em 0;
  font-weight: 600;
  padding-bottom: 0.3em;
  font-size: 2em;
  border-bottom: 1px solid hsla(210, 18%, 87%, 1);
}

.markdown-body mark {
  background-color: #ff0;
  color: #24292f;
}

.markdown-body small {
  font-size: 90%;
}

.markdown-body sub,
.markdown-body sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

.markdown-body sub {
  bottom: -0.25em;
}

.markdown-body sup {
  top: -0.5em;
}

.markdown-body img {
  border-style: none;
  max-width: 100%;
  box-sizing: content-box;
  background-color: #ffffff;
}

.markdown-body code,
.markdown-body kbd,
.markdown-body pre,
.markdown-body samp {
  font-family: monospace, monospace;
  font-size: 1em;
}

.markdown-body figure {
  margin: 1em 40px;
}

.markdown-body hr {
  box-sizing: content-box;
  overflow: hidden;
  background: transparent;
  border-bottom: 1px solid hsla(210, 18%, 87%, 1);
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d0d7de;
  border: 0;
}

.markdown-body html [type="button"],
.markdown-body [type="reset"],
.markdown-body [type="submit"] {
  -webkit-appearance: button;
}

.markdown-body [type="button"]::-moz-focus-inner,
.markdown-body [type="reset"]::-moz-focus-inner,
.markdown-body [type="submit"]::-moz-focus-inner {
  border-style: none;
  padding: 0;
}

.markdown-body [type="button"]:-moz-focusring,
.markdown-body [type="reset"]:-moz-focusring,
.markdown-body [type="submit"]:-moz-focusring {
  outline: 1px dotted ButtonText;
}

.markdown-body [type="checkbox"],
.markdown-body [type="radio"] {
  box-sizing: border-box;
  padding: 0;
}

.markdown-body [type="number"]::-webkit-inner-spin-button,
.markdown-body [type="number"]::-webkit-outer-spin-button {
  height: auto;
}

.markdown-body [type="search"] {
  -webkit-appearance: textfield;
  outline-offset: -2px;
}

.markdown-body [type="search"]::-webkit-search-cancel-button,
.markdown-body [type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
}

.markdown-body ::-webkit-input-placeholder {
  color: inherit;
  opacity: 0.54;
}

.markdown-body ::-webkit-file-upload-button {
  -webkit-appearance: button;
  font: inherit;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body hr::before {
  display: table;
  content: "";
}

.markdown-body hr::after {
  display: table;
  clear: both;
  content: "";
}

.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
}

.markdown-body td,
.markdown-body th {
  padding: 0;
}

.markdown-body details summary {
  cursor: pointer;
}

.markdown-body details:not([open]) > *:not(summary) {
  display: none !important;
}

.markdown-body kbd {
  display: inline-block;
  padding: 3px 5px;
  font: 11px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
    Liberation Mono, monospace;
  line-height: 10px;
  color: #24292f;
  vertical-align: middle;
  background-color: #f6f8fa;
  border: solid 1px rgba(175, 184, 193, 0.2);
  border-bottom-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 rgba(175, 184, 193, 0.2);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 33px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h2 {
  font-weight: 600;
  padding-bottom: 0.3em;
  font-size: 1.5em;
  border-bottom: 1px solid hsla(210, 18%, 87%, 1);
}

.markdown-body h3 {
  font-weight: 600;
  font-size: 1.25em;
}

.markdown-body h4 {
  font-weight: 600;
  font-size: 1em;
}

.markdown-body h5 {
  font-weight: 600;
  font-size: 0.875em;
}

.markdown-body h6 {
  font-weight: 600;
  font-size: 0.85em;
  color: #57606a;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 10px;
}

.markdown-body blockquote {
  margin: 0;
  padding: 0 1em;
  color: #57606a;
  border-left: 0.25em solid #d0d7de;
}

.markdown-body ul,
.markdown-body ol {
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 2em;
}

.markdown-body ol ol,
.markdown-body ul ol {
  list-style-type: lower-roman;
}

.markdown-body ul ul ol,
.markdown-body ul ol ol,
.markdown-body ol ul ol,
.markdown-body ol ol ol {
  list-style-type: lower-alpha;
}

.markdown-body dd {
  margin-left: 0;
}

.markdown-body tt,
.markdown-body code {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
    Liberation Mono, monospace;
  font-size: 12px;
}

.markdown-body pre {
  margin-top: 0;
  margin-bottom: 0;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
    Liberation Mono, monospace;
  font-size: 12px;
  word-wrap: normal;
}

.markdown-body :-ms-input-placeholder {
  color: #6e7781;
  opacity: 1;
}

.markdown-body ::-ms-input-placeholder {
  color: #6e7781;
  opacity: 1;
}

.markdown-body ::placeholder {
  color: #6e7781;
  opacity: 1;
}

.markdown-body .pl-c {
  color: #6e7781;
}

.markdown-body .pl-c1,
.markdown-body .pl-s .pl-v {
  color: #0550ae;
}

.markdown-body .pl-e,
.markdown-body .pl-en {
  color: #8250df;
}

.markdown-body .pl-smi,
.markdown-body .pl-s .pl-s1 {
  color: #24292f;
}

.markdown-body .pl-ent {
  color: #116329;
}

.markdown-body .pl-k {
  color: #cf222e;
}

.markdown-body .pl-s,
.markdown-body .pl-pds,
.markdown-body .pl-s .pl-pse .pl-s1,
.markdown-body .pl-sr,
.markdown-body .pl-sr .pl-cce,
.markdown-body .pl-sr .pl-sre,
.markdown-body .pl-sr .pl-sra {
  color: #0a3069;
}

.markdown-body .pl-v,
.markdown-body .pl-smw {
  color: #953800;
}

.markdown-body .pl-bu {
  color: #82071e;
}

.markdown-body .pl-ii {
  color: #f6f8fa;
  background-color: #82071e;
}

.markdown-body .pl-c2 {
  color: #f6f8fa;
  background-color: #cf222e;
}

.markdown-body .pl-sr .pl-cce {
  font-weight: bold;
  color: #116329;
}

.markdown-body .pl-ml {
  color: #3b2300;
}

.markdown-body .pl-mh,
.markdown-body .pl-mh .pl-en,
.markdown-body .pl-ms {
  font-weight: bold;
  color: #0550ae;
}

.markdown-body .pl-mi {
  font-style: italic;
  color: #24292f;
}

.markdown-body .pl-mb {
  font-weight: bold;
  color: #24292f;
}

.markdown-body .pl-md {
  color: #82071e;
  background-color: #ffebe9;
}

.markdown-body .pl-mi1 {
  color: #116329;
  background-color: #dafbe1;
}

.markdown-body .pl-mc {
  color: #953800;
  background-color: #ffd8b5;
}

.markdown-body .pl-mi2 {
  color: #eaeef2;
  background-color: #0550ae;
}

.markdown-body .pl-mdr {
  font-weight: bold;
  color: #8250df;
}

.markdown-body .pl-ba {
  color: #57606a;
}

.markdown-body .pl-sg {
  color: #8c959f;
}

.markdown-body .pl-corl {
  text-decoration: underline;
  color: #0a3069;
}

.markdown-body [data-catalyst] {
  display: block;
}

.markdown-body g-emoji {
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 1em;
  font-style: normal !important;
  font-weight: 400;
  line-height: 1;
  vertical-align: -0.075em;
}

.markdown-body g-emoji img {
  width: 1em;
  height: 1em;
}

.markdown-body::before {
  display: table;
  content: "";
}

.markdown-body::after {
  display: table;
  clear: both;
  content: "";
}

.markdown-body > *:first-child {
  margin-top: 0 !important;
}

.markdown-body > *:last-child {
  margin-bottom: 0 !important;
}

.markdown-body a:not([href]) {
  color: inherit;
  text-decoration: none;
}

.markdown-body .absent {
  color: #cf222e;
}

.markdown-body .anchor {
  float: left;
  padding-right: 4px;
  margin-left: -20px;
  line-height: 1;
}

.markdown-body .anchor:focus {
  outline: none;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre,
.markdown-body details {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body blockquote > :first-child {
  margin-top: 0;
}

.markdown-body blockquote > :last-child {
  margin-bottom: 0;
}

.markdown-body sup > a::before {
  content: "[";
}

.markdown-body sup > a::after {
  content: "]";
}

.markdown-body h1 .octicon-link,
.markdown-body h2 .octicon-link,
.markdown-body h3 .octicon-link,
.markdown-body h4 .octicon-link,
.markdown-body h5 .octicon-link,
.markdown-body h6 .octicon-link {
  color: #24292f;
  vertical-align: middle;
  visibility: hidden;
}

.markdown-body h1:hover .anchor,
.markdown-body h2:hover .anchor,
.markdown-body h3:hover .anchor,
.markdown-body h4:hover .anchor,
.markdown-body h5:hover .anchor,
.markdown-body h6:hover .anchor {
  text-decoration: none;
}

.markdown-body h1:hover .anchor .octicon-link,
.markdown-body h2:hover .anchor .octicon-link,
.markdown-body h3:hover .anchor .octicon-link,
.markdown-body h4:hover .anchor .octicon-link,
.markdown-body h5:hover .anchor .octicon-link,
.markdown-body h6:hover .anchor .octicon-link {
  visibility: visible;
}

.markdown-body h1 tt,
.markdown-body h1 code,
.markdown-body h2 tt,
.markdown-body h2 code,
.markdown-body h3 tt,
.markdown-body h3 code,
.markdown-body h4 tt,
.markdown-body h4 code,
.markdown-body h5 tt,
.markdown-body h5 code,
.markdown-body h6 tt,
.markdown-body h6 code {
  padding: 0 0.2em;
  font-size: inherit;
}

.markdown-body ul,
.markdown-body ol {
  list-style: disc;
}
.markdown-body ul.no-list,
.markdown-body ol.no-list {
  padding: 0;
  list-style-type: none;
}

.markdown-body ol[type="1"] {
  list-style-type: decimal;
}

.markdown-body ol[type="a"] {
  list-style-type: lower-alpha;
}

.markdown-body ol[type="i"] {
  list-style-type: lower-roman;
}

.markdown-body div > ol:not([type]) {
  list-style-type: decimal;
}

.markdown-body ul ul,
.markdown-body ul ol,
.markdown-body ol ol,
.markdown-body ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

.markdown-body li > p {
  margin-top: 16px;
}

.markdown-body li + li {
  margin-top: 0.25em;
}

.markdown-body dl {
  padding: 0;
}

.markdown-body dl dt {
  padding: 0;
  margin-top: 16px;
  font-size: 1em;
  font-style: italic;
  font-weight: 600;
}

.markdown-body dl dd {
  padding: 0 16px;
  margin-bottom: 16px;
}

.markdown-body table th {
  font-weight: 600;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

.markdown-body table tr {
  background-color: #ffffff;
  border-top: 1px solid hsla(210, 18%, 87%, 1);
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.markdown-body table img {
  background-color: transparent;
}

.markdown-body img[align="right"] {
  padding-left: 20px;
}

.markdown-body img[align="left"] {
  padding-right: 20px;
}

.markdown-body .emoji {
  max-width: none;
  vertical-align: text-top;
  background-color: transparent;
}

.markdown-body span.frame {
  display: block;
  overflow: hidden;
}

.markdown-body span.frame > span {
  display: block;
  float: left;
  width: auto;
  padding: 7px;
  margin: 13px 0 0;
  overflow: hidden;
  border: 1px solid #d0d7de;
}

.markdown-body span.frame span img {
  display: block;
  float: left;
}

.markdown-body span.frame span span {
  display: block;
  padding: 5px 0 0;
  clear: both;
  color: #24292f;
}

.markdown-body span.align-center {
  display: block;
  overflow: hidden;
  clear: both;
}

.markdown-body span.align-center > span {
  display: block;
  margin: 13px auto 0;
  overflow: hidden;
  text-align: center;
}

.markdown-body span.align-center span img {
  margin: 0 auto;
  text-align: center;
}

.markdown-body span.align-right {
  display: block;
  overflow: hidden;
  clear: both;
}

.markdown-body span.align-right > span {
  display: block;
  margin: 13px 0 0;
  overflow: hidden;
  text-align: right;
}

.markdown-body span.align-right span img {
  margin: 0;
  text-align: right;
}

.markdown-body span.float-left {
  display: block;
  float: left;
  margin-right: 13px;
  overflow: hidden;
}

.markdown-body span.float-left span {
  margin: 13px 0 0;
}

.markdown-body span.float-right {
  display: block;
  float: right;
  margin-left: 13px;
  overflow: hidden;
}

.markdown-body span.float-right > span {
  display: block;
  margin: 13px auto 0;
  overflow: hidden;
  text-align: right;
}

.markdown-body code,
.markdown-body tt {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
}

.markdown-body code br,
.markdown-body tt br {
  display: none;
}

.markdown-body del code {
  text-decoration: inherit;
}

.markdown-body pre code {
  font-size: 100%;
}

.markdown-body pre > code {
  padding: 0;
  margin: 0;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
}

.markdown-body .highlight {
  margin-bottom: 16px;
}

.markdown-body .highlight pre {
  margin-bottom: 0;
  word-break: normal;
}

.markdown-body .highlight pre,
.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
}

.markdown-body pre code,
.markdown-body pre tt {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.markdown-body pre pre {
  background: none !important;
}

.markdown-body .csv-data td,
.markdown-body .csv-data th {
  padding: 5px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
}

.markdown-body .csv-data .blob-num {
  padding: 10px 8px 9px;
  text-align: right;
  background: #ffffff;
  border: 0;
}

.markdown-body .csv-data tr {
  border-top: 0;
}

.markdown-body .csv-data th {
  font-weight: 600;
  background: #f6f8fa;
  border-top: 0;
}

.markdown-body .footnotes {
  font-size: 12px;
  color: #57606a;
  border-top: 1px solid #d0d7de;
}

.markdown-body .footnotes ol {
  padding-left: 16px;
}

.markdown-body .footnotes li {
  position: relative;
}

.markdown-body .footnotes li:target::before {
  position: absolute;
  top: -8px;
  right: -8px;
  bottom: -8px;
  left: -24px;
  pointer-events: none;
  content: "";
  border: 2px solid #0969da;
  border-radius: 6px;
}

.markdown-body .footnotes li:target {
  color: #24292f;
}

.markdown-body .footnotes .data-footnote-backref g-emoji {
  font-family: monospace;
}

.markdown-body [hidden] {
  display: none !important;
}

.markdown-body ::-webkit-calendar-picker-indicator {
  filter: invert(50%);
}
`