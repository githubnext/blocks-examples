import { useCallback, useEffect, useState } from "react";
// @ts-ignore
import loadable from "@loadable/component";
import {
  FileContext,
  FolderContext,
  RepoFiles,
  onRequestGitHubData as onRequestGitHubDataFetch,
} from "@githubnext/utils";

interface Block {
  id: string;
  type: string;
  title: string;
  description: string;
  entry: string;
  extensions?: string[];
  owner?: string;
  repo?: string;
}
interface LocalBlockProps {
  block: Block;
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext;
}
export const LocalBlock = (props: LocalBlockProps) => {
  const { block, contents, tree, metadata = {}, context } = props;

  const [Block, setBlock] = useState<React.ComponentType<any> | null>(null);

  const getContents = async () => {
    const content = await loadable(() => import(`../../..${block.entry}`));
    setBlock(content);
  };
  useEffect(() => {
    getContents();
  }, [block.entry]);

  const onUpdateMetadata = (newMetadata: any) => {
    console.log(`Triggered a request to update the file metadata`);
    console.log("From:", metadata);
    console.log("To:", newMetadata);
    window.postMessage(
      {
        type: "update-metadata",
        metadata: newMetadata,
      },
      "*"
    );
  };
  const onNavigateToPath = useCallback((path) => {
    console.log(`Triggered a navigation to the file/folder: ${path}`);
    window.postMessage(
      {
        type: "navigate-to-path",
        path,
      },
      "*"
    );
  }, []);
  const onRequestUpdateContent = useCallback((content) => {
    console.log(`Triggered a request to update the file contents`);
    console.log("From:", contents);
    console.log("To:", content);
    window.postMessage(
      {
        type: "update-file",
        content,
      },
      "*"
    );
  }, []);
  const onRequestGitHubData = async (
    path: string,
    params: Record<string, any> = {},
    id: string = ""
  ) => {
    console.log(`Triggered a request to fetch data from GitHub: ${path}`);
    window.postMessage(
      {
        type: "github-data--request",
        id,
        path,
        params,
      },
      "*"
    );
    const data = await onRequestGitHubDataFetch(path, params);
    window.postMessage(
      {
        type: "github-data--response",
        id,
        data,
      },
      "*"
    );
    return data;
  };

  if (!Block) return null;
  return (
    <Block
      context={context}
      content={contents}
      tree={tree}
      metadata={metadata}
      onUpdateMetadata={onUpdateMetadata}
      onNavigateToPath={onNavigateToPath}
      onRequestUpdateContent={onRequestUpdateContent}
      onRequestGitHubData={onRequestGitHubData}
    />
  );
};
