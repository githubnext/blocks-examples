import { useCallback, useEffect, useState } from "react";
// @ts-ignore
import loadable from "@loadable/component";
import { FileContext, FolderContext, RepoFiles } from "@githubnext/utils";
import uniqueId from "lodash/uniqueId";

interface LocalBlockProps {
  block: {
    type: string;
    title: string;
    description: string;
    entry: string;
    extensions?: string[];
  };
  contents?: string;
  tree?: RepoFiles;
  metadata?: any;
  context: FileContext | FolderContext
}
export const LocalBlock = (props: LocalBlockProps) => {
  const {
    block,
    contents,
    tree,
    metadata = {},
    context,
  } = props;

  const [Block, setBlock] = useState<React.ComponentType<any> | null>(null);

  const getContents = async () => {
    const content = await loadable(() => import(
      `../../..${block.entry}`
    ))
    setBlock(content)
  }
  useEffect(() => { getContents() }, [block.entry])

  const onUpdateMetadata = (newMetadata: any) => {
    window.postMessage({
      type: "update-metadata",
      context,
      metadata: newMetadata,
    }, "*")
  }
  const onNavigateToPath = useCallback((path) => {
    if (typeof window === "undefined") return
    window.postMessage({
      type: "navigate-to-path",
      context,
      path: path,
    }, "*")
  }, [])
  const onRequestUpdateContent = useCallback((content) => {
    if (typeof window === "undefined") return
    window.postMessage({
      type: "update-file",
      context,
      content,
    }, "*")
  }, [])
  const onRequestGitHubData = useCallback((requestType, config) => {
    if (typeof window === "undefined") return
    const id = uniqueId("github-data--request")
    window.postMessage({
      type: "github-data--request",
      context,
      id,
      requestType,
      config,
    }, "*")

    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        if (event.data.type !== "github-data--response") return
        if (event.data.id !== id) return
        window.removeEventListener("message", onMessage)
        resolve(event.data.data)
      }
      window.addEventListener("message", onMessage)
      const maxDelay = 1000 * 60 * 5
      window.setTimeout(() => {
        window.removeEventListener("message", onMessage)
        reject(new Error("Timeout"))
      }, maxDelay)
    })
  }, [])

  if (!Block) return null
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
  )

}