import { useEffect, useState } from "react";
import { FolderBlockProps, } from "@githubnext/utils";

export default function (props: FolderBlockProps) {
  const { onRequestGitHubData } = props;

  const [url, setUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSiteUrl = async () => {
    const info = await onRequestGitHubData("repo-info", {
      owner: props.context.owner,
      repo: props.context.repo,
    })
    setUrl(info.homepage);
    setIsLoading(false);
  }
  useEffect(() => { getSiteUrl() }, []);

  if (isLoading) return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      color: "#999",
      padding: "10em 2em",
      fontStyle: "italic",
    }}>
      Loading...
    </div>
  )
  if (!url && !isLoading) return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      color: "#999",
      padding: "10em 2em",
      fontStyle: "italic",
    }}>
      This repo doesn't have a URL specified
    </div>
  )

  return (
    <iframe style={{
      width: "100%",
      height: "100%",
      border: "none",
    }}
      // @ts-ignore
      src={url}
      title="Website"
      frameBorder="0"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}