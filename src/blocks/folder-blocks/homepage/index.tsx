import { useEffect, useMemo, useState } from "react";
import { FolderBlockProps, getNestedFileTree, } from "@githubnext/utils";
import Select from 'react-select'

export default function (props: FolderBlockProps) {
  const { context } = props;

  const [url, setUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSiteUrl = async () => {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}`
    const response = await fetch(url);
    const json = await response.json();
    setUrl(json.homepage);
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