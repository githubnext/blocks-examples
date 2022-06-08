import { tw } from "twind";
import { Block, FileBlockProps } from "@githubnext/blocks";
// @ts-ignore
import MDX from "@mdx-js/runtime";
import { Box, Link } from "@primer/react";
import { createContext, useEffect, useMemo, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { ErrorBoundary } from "./ErrorBoundary";
import "./style.css";

export const MarkdownContext = createContext<any>({});
export default function (props: FileBlockProps) {
  const { content, onRequestBlocksRepos } = props;

  const [blockOptions, setBlockOptions] = useState<Record<string, Block>>({});

  const getBlocks = async () => {
    const blocksRepos = await onRequestBlocksRepos();
    let blocks = {};
    blocksRepos.forEach((repo) => {
      repo.blocks.forEach((block) => {
        const id = [repo.owner, repo.repo, block.id].join("__");
        blocks[id] = block;
      });
    });
    setBlockOptions(blocks);
  };
  useEffect(() => {
    getBlocks();
  }, []);

  const components = useMemo(
    () => ({
      BlockComponent: BlockComponent({ ...props, blockOptions }),
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
      a: InlineLink,
    }),
    [BlockComponent, blockOptions]
  );

  return (
    <div className={tw(`w-full h-full flex items-stretch overflow-hidden`)}>
      <div
        className={tw(
          `flex-1 markdown-body p-6 pb-40 overflow-y-auto whitespace-pre-wrap`
        )}
      >
        <div className={tw(`max-w-[60em] mx-auto`)}>
          <ErrorBoundary key={content}>
            <MDX components={components}>{content}</MDX>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
function InlineLink(props: Record<string, any>) {
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

const BlockComponent =
  (
    props: FileBlockProps & {
      blockOptions: Record<string, Block>;
    }
  ) =>
  ({ blockId = "", path = "", context = {} }) => {
    const { BlockComponent, blockOptions } = props;

    const block = blockOptions[blockId];

    const combinedContext = useMemo(
      () => ({
        ...props.context,
        ...context,
      }),
      [props.context, context]
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
            <strong>{block?.title || blockId}</strong> showing
            <code className="!ml-1 inline-block">
              {combinedContext.owner}/{combinedContext.repo}
            </code>
            :<code className="!ml-1 inline-block">{path || "/"}</code>
          </div>
          <Link
            href={`https://blocks.githubnext.com/${combinedContext.owner}/${
              combinedContext.repo
            }?path=${path || "/"}&blockKey=${blockId}`}
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
          {block ? (
            <BlockComponent
              {...props}
              block={block}
              path={path}
              context={combinedContext}
            />
          ) : (
            <div
              className={tw(`flex h-full w-full items-center justify-center`)}
            >
              <p>
                {Object.keys(blockOptions).length ? (
                  <strong>Block not found</strong>
                ) : (
                  <p>Loading Block example</p>
                )}
              </p>
            </div>
          )}
        </Box>
      </div>
    );
  };
