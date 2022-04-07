import { FileBlockProps } from "@githubnext/utils";
import { Grid } from "@githubocto/flat-ui";
import { csvFormat, csvParseRows } from "d3";
import { useMemo, useState } from "react";

export default function (props: FileBlockProps) {
  const { content, onRequestUpdateContent } = props;

  const data = useMemo(() => {
    try {
      const rows = csvParseRows(content);
      const headers = rows[0];
      const csvData = rows.slice(1).map((row: any) => {
        return headers.reduce((acc: Record<string, any>, key, i) => {
          acc[key] = Number.isFinite(row[i]) ? +row[i] : row[i];
          return acc;
        }, {});
      });
      return csvData;
    } catch (e) {
      return [];
    }
  }, [content]);

  return (
    <div className="height-full d-flex flex-column flex-1">
      <Grid
        data={data}
        diffData={data}
        canDownload={false}
        isEditable
        onEdit={(data: any) => {
          onRequestUpdateContent(csvFormat(data));
        }}
      />
    </div>
  );
}
