import { useMemo } from "react";
import { csvParse } from "d3";
import { Grid } from "@githubocto/flat-ui";
import { FileViewerProps } from "@githubnext/utils";

export function Viewer(props: FileViewerProps) {
  const { content } = props;

  const data = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch (e) {
      try {
        const csvData = csvParse(content);
        return csvData;
      } catch (e) {
        return [];
      }
    }
  }, [content]);

  return <Grid data={data} />;
}
