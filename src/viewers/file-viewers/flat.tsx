import { useMemo } from "react";
import { csvParse } from "d3";
import { Grid } from "@githubocto/flat-ui";

export function Viewer({ contents }: { contents: string }) {
  const data = useMemo(() => {
    try {
      return JSON.parse(contents);
    } catch (e) {
      try {
        const csvData = csvParse(contents);
        return csvData;
      } catch (e) {
        return [];
      }
    }
  }, [contents]);

  return <Grid data={data} />;
}
