import { useMemo } from "react";
import { csvParse } from "d3";
import { Grid } from "@githubocto/flat-ui";
import { FileBlockProps } from "@githubnext/utils";

export default function (props: FileBlockProps) {
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
