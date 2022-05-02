import { tw } from "twind";
import { useCallback, useEffect, useState } from "react";
import { FolderBlockProps } from "@githubnext/utils";
import { Endpoints } from "@octokit/types";
import { getRelativeTime } from "./utils";
import { Heading, Link, Text, Label } from "@primer/react";

// Note: We're using a BlockComponent prop here to create nested Blocks.
// This is only implemented for our own example Blocks, to showcase the concept.

type IssueType =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"][0];
type PullType =
  Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][0];
const maxItems = 3;

export default function (props: FolderBlockProps) {
  const { context, onRequestGitHubData, BlockComponent } = props;
  const [hasLoadedActivity, setHasLoadedActivity] = useState(false);
  const [hasLoadedReadme, setHasLoadedReadme] = useState(false);
  const [issues, setIssues] = useState<IssueType[]>([]);
  const [pulls, setPulls] = useState<PullType[]>([]);
  const [doesHaveReadme, setDoesHaveReadme] = useState(false);

  const isRoot = !context.path;

  const getReadmeAvailability = async () => {
    const url = `/repos/${context.owner}/${context.repo}/contents/${
      context.path ? `${context.path}/` : ""
    }README.md`;
    try {
      const data = await onRequestGitHubData(url, {
        ref: context.sha,
      });
      setDoesHaveReadme(!!data);
    } catch (e) {
      setDoesHaveReadme(false);
    } finally {
      setHasLoadedReadme(true);
    }
  };

  const getActivity = async () => {
    if (!isRoot) {
      setHasLoadedActivity(true);
      return;
    }

    try {
      const issuesUrl = `/repos/${context.owner}/${context.repo}/issues`;
      const issues = await onRequestGitHubData(issuesUrl, {
        path: context.path,
        sha: context.sha,
      });
      setIssues(issues || []);

      const pullsUrl = `/repos/${context.owner}/${context.repo}/pulls`;
      const pulls = await onRequestGitHubData(pullsUrl, {
        path: context.path,
        sha: context.sha,
      });
      setPulls(pulls || []);
    } catch (e) {
    } finally {
      setHasLoadedActivity(true);
    }
  };
  useEffect(() => {
    getReadmeAvailability();
    getActivity();
  }, []);

  return (
    <div className={tw(`w-full`)}>
      <div className={tw(`p-3 flex-none`)}>
        {!isRoot ? null : !hasLoadedActivity ? (
          <div className={tw(`px-3 py-10 w-full text-center`)}>
            <Text color="fg.muted" sx={{ fontStyle: "italic" }}>
              Loading...
            </Text>
          </div>
        ) : (
          <div className={tw(`flex w-full`)}>
            <div className={tw(`flex-1 p-2`)}>
              <Heading sx={{ fontSize: 4 }} className={tw(`px-3 py-1`)}>
                Issues
              </Heading>
              {!issues.length && (
                <div className={tw(`p-3`)}>
                  <Text color="fg.muted" sx={{ fontStyle: "italic" }}>
                    No issues
                  </Text>
                </div>
              )}
              {issues.slice(0, maxItems).map((issue: IssueType) => (
                <Issue issue={issue} />
              ))}
              {issues.length > maxItems && (
                <a
                  href={`https://github.com/${context.owner}/${context.repo}/issues`}
                  className={tw(`block px-3 py-2`)}
                >
                  + {issues.length - maxItems} more
                </a>
              )}
            </div>
            <div className={tw(`flex-1 p-2`)}>
              <Heading sx={{ fontSize: 4 }} className={tw(`px-3 py-1`)}>
                PRs
              </Heading>
              {!pulls.length && (
                <div className={tw(`p-3`)}>
                  <Text color="fg.muted" sx={{ fontStyle: "italic" }}>
                    No open Pull Requests
                  </Text>
                </div>
              )}
              {pulls.slice(0, maxItems).map((pull: PullType) => (
                <Pull pull={pull} />
              ))}
              {pulls.length > maxItems && (
                <a
                  href={`https://github.com/${context.owner}/${context.repo}/pulls`}
                  className={tw(`block px-3 py-2`)}
                >
                  + {pulls.length - maxItems} more
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      {hasLoadedReadme && (
        <div className={tw(`w-full`)}>
          {!BlockComponent ? (
            "No BlockComponent"
          ) : doesHaveReadme ? (
            // strange height here to make sure the entire readme is visible
            // we're in an awkward spot because the nested Component is in an iframe
            // so we have to guess its height
            // thankfully, if it's taller, the main page will scroll, but we'd rather avoid that in most cases
            // because it feels funky to have two full-width scrolling elements
            <div className={tw(`h-[150em]`)}>
              <BlockComponent
                {...props}
                block={readmeBlock}
                path={`${context.path}/README.md`}
              />
            </div>
          ) : (
            <BlockComponent
              {...props}
              block={minimapBlock}
              path={context.path}
            />
          )}
        </div>
      )}
    </div>
  );
}

const Issue = ({ issue }: { issue: IssueType }) => {
  return (
    <div className={tw(`p-3`)}>
      <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>
        <Link href={issue.html_url} className={tw(`mr-1`)}>
          #{issue.number}
        </Link>
        {issue.title}
      </Heading>
      <p className={tw(`mt-1 mb-1 f5`)}>
        <Label
          variant={issue.state === "open" ? "success" : "danger"}
          className={`mr-1`}
        >
          {issue.state}
        </Label>
        <Text
          sx={{ fontSize: 1 }}
          color="fg.muted"
          as="time"
          dateTime={issue.updated_at}
        >
          {getRelativeTime(new Date(issue.updated_at))}
        </Text>
      </p>
      <Text color="fg.muted" as="p">
        {(issue.body || "").slice(0, 130)}
        {issue?.body?.length && issue.body.length > 130 ? "..." : ""}
      </Text>
    </div>
  );
};
const Pull = ({ pull }: { pull: PullType }) => {
  return (
    <div className={tw(`p-3`)}>
      <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>
        <Link href={pull.html_url} className={tw(`mr-1`)}>
          #{pull.number}
        </Link>
        {pull.title}
      </Heading>

      <p className={tw(`mt-1 mb-1 f5 color-fg-muted`)}>
        <Label
          variant={pull.state === "open" ? "success" : "danger"}
          className={`mr-1`}
        >
          {pull.state}
        </Label>
        <Text
          sx={{ fontSize: 1 }}
          color="fg.muted"
          as="time"
          dateTime={pull.updated_at}
        >
          {getRelativeTime(new Date(pull.updated_at))}
        </Text>
      </p>
      <Text color="fg.muted" as="p">
        {(pull.body || "").slice(0, 130)}
        {pull?.body?.length && pull.body.length > 130 ? "..." : ""}
      </Text>
    </div>
  );
};

const readmeBlock = {
  type: "file",
  id: "markdown-block",
  title: "Markdown",
  description:
    "View markdown files. You can also view live repo info, using Issues, Releases, and Commits custom components, as well as live code examples with CodeSandbox.",
  sandbox: true,
  entry: "/src/blocks/file-blocks/live-markdown/index.tsx",
  owner: "githubnext",
  repo: "blocks-examples",
};

const minimapBlock = {
  type: "folder",
  id: "minimap-block",
  title: "Minimap",
  description: "A visualization of your folders and files",
  sandbox: false,
  entry: "/src/blocks/folder-blocks/minimap/index.tsx",
  owner: "githubnext",
  repo: "blocks-examples",
};
